package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.core.service.JwtService;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import de.tum.cit.aet.usermanagement.dto.auth.PasskeyActionTokenDTO;
import de.tum.cit.aet.usermanagement.dto.auth.PasskeyDTO;
import io.netty.channel.ChannelOption;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.authorization.client.AuthzClient;
import org.keycloak.authorization.client.Configuration;
import org.keycloak.representations.AccessTokenResponse;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

/**
 * Service for authenticating users against Keycloak and handling token lifecycle operations (password login,
 * refresh, logout, token exchange/impersonation).
 */
@Slf4j
@Service
public class KeycloakAuthenticationService {

    private static final String GRANT_TYPE_TOKEN_EXCHANGE = "urn:ietf:params:oauth:grant-type:token-exchange";
    private static final String GRANT_TYPE_REFRESH = "refresh_token";

    private final AuthzClient externalRealmAuthzClient;
    private final AuthzClient tumRealmAuthzClient;

    private final String keycloakUrl;
    private final String externalRealm;
    private final String tumLoginRealm;
    private final String browserClientId;
    private final String externalServerClientId;
    private final String externalServerClientSecret;
    private final String tumServerClientId;
    private final String tumServerClientSecret;

    private final String adminClientId;
    private final String adminClientSecret;

    private final WebClient webClient;
    private final JwtService jwtService;
    private final KeycloakUserService keycloakUserService;
    private final ConcurrentMap<String, CompletableFuture<AuthResponseDTO>> inFlightRefreshes = new ConcurrentHashMap<>();

    public KeycloakAuthenticationService(
        @Value("${keycloak.url}") String keycloakUrl,
        @Value("${keycloak.external-login-realm}") String externalRealm,
        @Value("${keycloak.tum-login-realm}") String tumLoginRealm,
        @Value("${keycloak.client-id}") String browserClientId,
        @Value("${keycloak.server.external.client-id}") String externalServerClientId,
        @Value("${keycloak.server.external.client-secret}") String externalServerClientSecret,
        @Value("${keycloak.server.tum.client-id}") String tumServerClientId,
        @Value("${keycloak.server.tum.client-secret}") String tumServerClientSecret,
        @Value("${keycloak.admin.external.client-id}") String adminClientId,
        @Value("${keycloak.admin.external.client-secret}") String adminClientSecret,
        JwtService jwtService,
        KeycloakUserService keycloakUserService
    ) {
        this.externalRealmAuthzClient = AuthzClient.create(
            new Configuration(keycloakUrl, externalRealm, externalServerClientId, Map.of("secret", externalServerClientSecret), null)
        );
        this.tumRealmAuthzClient = AuthzClient.create(
            new Configuration(keycloakUrl, tumLoginRealm, tumServerClientId, Map.of("secret", tumServerClientSecret), null)
        );
        this.keycloakUrl = keycloakUrl;
        this.externalRealm = externalRealm;
        this.tumLoginRealm = tumLoginRealm;
        this.browserClientId = browserClientId;
        this.externalServerClientId = externalServerClientId;
        this.externalServerClientSecret = externalServerClientSecret;
        this.tumServerClientId = tumServerClientId;
        this.tumServerClientSecret = tumServerClientSecret;

        this.adminClientId = adminClientId;
        this.adminClientSecret = adminClientSecret;

        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(5))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000);

        this.webClient = WebClient.builder().clientConnector(new ReactorClientHttpConnector(httpClient)).build();
        this.jwtService = jwtService;
        this.keycloakUserService = keycloakUserService;
    }

    /**
     * Authenticates an end user with email (username) and password using the OIDC password grant via
     * Keycloak's Authorization Client. Tries the external-login realm first and falls back to the TUM
     * realm so seeded test users in either realm can sign in via the email/password form.
     *
     * @param email    user's email (username)
     * @param password user's password
     * @return DTO with access token, optional refresh token and lifetimes
     * @throws UnauthorizedException if authentication fails in both realms or the response is invalid
     */
    public AuthResponseDTO loginWithCredentials(String email, String password) {
        try {
            AccessTokenResponse token = externalRealmAuthzClient.obtainAccessToken(email, password);
            return getResponseFromToken(token);
        } catch (Exception externalFailure) {
            try {
                AccessTokenResponse token = tumRealmAuthzClient.obtainAccessToken(email, password);
                return getResponseFromToken(token);
            } catch (Exception tumFailure) {
                throw new UnauthorizedException("Invalid username or password", tumFailure);
            }
        }
    }

    /**
     * Logs out an end-user session by calling the realm's OIDC Logout Endpoint using the provided refresh token.
     *
     * @param refreshToken the user's refresh token to invalidate
     * @throws UnauthorizedException if the logout request is rejected or fails
     */
    public void invalidateRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        // The refresh token can come from either realm (external login or TUM IDP); try each in turn.
        if (
            !logoutWithClient(this.externalRealm, this.externalServerClientId, this.externalServerClientSecret, refreshToken) &&
            !logoutWithClient(this.externalRealm, this.adminClientId, this.adminClientSecret, refreshToken) &&
            !logoutWithClient(this.tumLoginRealm, this.tumServerClientId, this.tumServerClientSecret, refreshToken) &&
            !logoutWithClient(this.tumLoginRealm, this.adminClientId, this.adminClientSecret, refreshToken)
        ) {
            throw new UnauthorizedException("Failed to logout user");
        }
    }

    /**
     * Normalizes incoming cookie tokens to tokens minted for the configured application client ({@code clientId}).
     * <p>
     * - If the provided access token's authorized party (azp) is NOT {@code clientId}, we perform a subject-only
     * Token Exchange (impersonation) to mint fresh Access/Refresh tokens for {@code clientId}.
     * - Else, if a refresh token is present, we perform a standard OIDC refresh to keep TTL semantics.
     * - Else, we still perform a subject-only Token Exchange to mint a fresh pair with correct azp.
     *
     * @param accessToken  the bearer token from the HttpOnly cookie (required)
     * @param refreshToken optional refresh token from the HttpOnly cookie
     * @return DTO with access token, refresh token and lifetimes for {@code clientId}
     */
    public AuthResponseDTO refreshTokens(String accessToken, String refreshToken) {
        if (StringUtil.isBlank(refreshToken)) {
            return refreshTokensInternal(accessToken, refreshToken);
        }

        CompletableFuture<AuthResponseDTO> newRefresh = new CompletableFuture<>();
        CompletableFuture<AuthResponseDTO> inFlight = inFlightRefreshes.putIfAbsent(refreshToken, newRefresh);
        if (inFlight != null) {
            try {
                return inFlight.join();
            } catch (CompletionException ex) {
                Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
                if (cause instanceof RuntimeException runtimeException) {
                    throw runtimeException;
                }
                throw new UnauthorizedException("Refresh failed", cause);
            }
        }

        try {
            AuthResponseDTO refreshed = refreshTokensInternal(accessToken, refreshToken);
            newRefresh.complete(refreshed);
            return refreshed;
        } catch (RuntimeException ex) {
            newRefresh.completeExceptionally(ex);
            throw ex;
        } finally {
            inFlightRefreshes.remove(refreshToken, newRefresh);
        }
    }

    private AuthResponseDTO refreshTokensInternal(String accessToken, String refreshToken) {
        Jwt jwt = decodeAccessTokenSafely(accessToken);
        String preferredRealm = determinePreferredRealm(jwt);
        String fallbackRealm = preferredRealm.equals(this.externalRealm) ? this.tumLoginRealm : this.externalRealm;
        List<String> refreshFailures = new ArrayList<>();

        if (StringUtil.isBlank(refreshToken)) {
            return buildSessionFromActiveAccessTokenOrThrow(accessToken, jwt);
        }

        AuthResponseDTO viaAccessToken = tryRefreshUsingActiveAccessToken(jwt, refreshToken, preferredRealm, fallbackRealm, refreshFailures);
        if (viaAccessToken != null) {
            return viaAccessToken;
        }

        AuthResponseDTO viaRefreshToken = tryRefreshUsingRefreshTokenOnly(
            refreshToken,
            preferredRealm,
            fallbackRealm,
            refreshFailures
        );
        if (viaRefreshToken != null) {
            return viaRefreshToken;
        }

        throw buildRefreshFailure(refreshFailures, jwt != null ? jwtService.getAuthorizedParty(jwt) : null, jwt);
    }

    private Jwt decodeAccessTokenSafely(String accessToken) {
        try {
            return jwtService.decode(accessToken);
        } catch (UnauthorizedException ex) {
            log.debug("refreshTokens(): access token decode failed, continuing with refresh-token path: {}", ex.getMessage());
            return null;
        }
    }

    private AuthResponseDTO buildSessionFromActiveAccessTokenOrThrow(String accessToken, Jwt jwt) {
        if (jwt != null && jwtService.isActive(jwt)) {
            return new AuthResponseDTO(accessToken, "", jwtService.secondsUntilExpiry(jwt), 0);
        }
        throw new UnauthorizedException("Session expired");
    }

    private AuthResponseDTO tryRefreshUsingActiveAccessToken(
        Jwt jwt,
        String refreshToken,
        String preferredRealm,
        String fallbackRealm,
        List<String> refreshFailures
    ) {
        if (jwt == null || !jwtService.isActive(jwt)) {
            return null;
        }

        String authorizedParty = jwtService.getAuthorizedParty(jwt);
        if (isServerClient(authorizedParty)) {
            AccessTokenResponse serverRefresh = tryRefreshWithServerClients(preferredRealm, fallbackRealm, refreshToken, refreshFailures);
            if (serverRefresh != null) {
                return getResponseFromToken(serverRefresh);
            }
            throw buildRefreshFailure(refreshFailures, authorizedParty, jwt);
        }

        if (adminClientId.equals(authorizedParty)) {
            return exchangeUsingSubject(jwt.getSubject());
        }

        refreshFailures.add("Access token azp '" + authorizedParty + "' not in configured clients [" + configuredClients() + "]");
        return null;
    }

    private AuthResponseDTO tryRefreshUsingRefreshTokenOnly(
        String refreshToken,
        String preferredRealm,
        String fallbackRealm,
        List<String> refreshFailures
    ) {
        AccessTokenResponse serverRefresh = tryRefreshWithServerClients(preferredRealm, fallbackRealm, refreshToken, refreshFailures);
        if (serverRefresh != null) {
            return getResponseFromToken(serverRefresh);
        }

        AccessTokenResponse otpRefresh = tryRefreshWithAdminClient(preferredRealm, fallbackRealm, refreshToken, refreshFailures);
        if (otpRefresh == null) {
            return null;
        }
        Jwt otpJwt = jwtService.decode(otpRefresh.getToken());
        return exchangeUsingSubject(otpJwt.getSubject());
    }

    private AccessTokenResponse tryRefreshWithServerClients(
        String preferredRealm,
        String fallbackRealm,
        String refreshToken,
        List<String> refreshFailures
    ) {
        AccessTokenResponse serverRefresh = tryRefreshTokensWithClient(
            preferredRealm,
            serverClientIdForRealm(preferredRealm),
            serverClientSecretForRealm(preferredRealm),
            refreshToken,
            refreshFailures
        );
        if (serverRefresh != null) {
            return serverRefresh;
        }
        return tryRefreshTokensWithClient(
            fallbackRealm,
            serverClientIdForRealm(fallbackRealm),
            serverClientSecretForRealm(fallbackRealm),
            refreshToken,
            refreshFailures
        );
    }

    private AccessTokenResponse tryRefreshWithAdminClient(
        String preferredRealm,
        String fallbackRealm,
        String refreshToken,
        List<String> refreshFailures
    ) {
        AccessTokenResponse otpRefresh = tryRefreshTokensWithClient(
            preferredRealm,
            adminClientId,
            adminClientSecret,
            refreshToken,
            refreshFailures
        );
        if (otpRefresh != null) {
            return otpRefresh;
        }
        return tryRefreshTokensWithClient(fallbackRealm, adminClientId, adminClientSecret, refreshToken, refreshFailures);
    }

    private AuthResponseDTO exchangeUsingSubject(String subject) {
        if (StringUtil.isBlank(subject)) {
            throw new UnauthorizedException("Access token missing subject");
        }
        return exchangeForUserTokens(subject);
    }

    private String configuredClients() {
        return externalServerClientId + ", " + tumServerClientId + ", " + adminClientId;
    }

    /**
     * Exchanges the service-account token for end-user tokens using the OIDC Token Exchange grant (impersonation).
     *
     * @param keycloakUserId the target user's Keycloak ID (UUID)
     * @return DTO with access token and optional refresh token
     * @throws UnauthorizedException if obtaining the admin token or the exchange request fails
     */
    public AuthResponseDTO exchangeForUserTokens(String keycloakUserId) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        addClientAuth(form, adminClientId, adminClientSecret);
        form.add("grant_type", GRANT_TYPE_TOKEN_EXCHANGE);
        form.add("requested_subject", keycloakUserId);
        form.add("audience", externalServerClientId);

        AccessTokenResponse tokenResponse = callKeycloak(this.externalRealm, OidcEndpoint.TOKEN, form, "Token exchange failed")
            .bodyToMono(AccessTokenResponse.class)
            .block(Duration.ofSeconds(5));
        return getResponseFromToken(tokenResponse);
    }

    /**
     * Creates a DTO containing the necessary information to perform passkey-related actions on the client side,
     * such as registering a new passkey.
     *
     * @param jwt the user's current access token as a JWT
     * @return DTO with realm, client ID, token value and expiry for passkey actions
     */
    public PasskeyActionTokenDTO createPasskeyActionToken(Jwt jwt) {
        return new PasskeyActionTokenDTO(
            getRealmFromJwt(jwt),
            getPasskeyClientId(jwt),
            jwt.getTokenValue(),
            jwtService.secondsUntilExpiry(jwt)
        );
    }

    /**
     * Lists the user's credentials from Keycloak and filters them to return only passkey-related credentials.
     *
     * @param jwt the user's current access token as a JWT
     * @return list of passkey credentials projected as DTOs
     */
    public List<PasskeyDTO> listPasskeys(Jwt jwt) {
        return keycloakUserService
            .getCredentials(jwt.getSubject(), jwt.getIssuer())
            .stream()
            .filter(this::isPasskeyCredential)
            .map(PasskeyDTO::of)
            .toList();
    }

    /**
     * Removes a passkey credential from the user's account in Keycloak.
     *
     * @param jwt          the user's current access token as a JWT
     * @param credentialId the ID of the credential to remove
     */
    public void removePasskey(Jwt jwt, String credentialId) {
        keycloakUserService.removeCredential(jwt.getSubject(), jwt.getIssuer(), credentialId);
    }

    // ===== Helpers =====

    /**
     * Helper to call the OIDC Logout Endpoint with the given client credentials and refresh token.
     *
     * @param clientId     the client ID to authenticate as
     * @param clientSecret the client secret to authenticate with
     * @param refreshToken the user's refresh token
     * @return true if logout succeeded, false if it was rejected (4xx)
     */
    private boolean logoutWithClient(String realm, String clientId, String clientSecret, String refreshToken) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            addClientAuth(form, clientId, clientSecret);
            form.add("refresh_token", refreshToken);
            callKeycloak(realm, OidcEndpoint.LOGOUT, form, "Failed to logout user").toBodilessEntity().block(Duration.ofSeconds(5));
            return true;
        } catch (UnauthorizedException ex) {
            log.debug("Logout with client {} on realm {} failed: {}", clientId, realm, ex.getMessage());
            return false;
        }
    }

    /**
     * Refreshes an end user's tokens using {@code grant_type=refresh_token} against the OIDC Token Endpoint.
     *
     * @param clientId     the client ID to authenticate as
     * @param clientSecret the client secret to authenticate with
     * @param refreshToken the user's refresh token
     * @return DTO with fresh access token, refresh token, and lifetimes
     * @throws UnauthorizedException if the request is rejected or fails
     */
    private AccessTokenResponse refreshTokensWithClient(String targetRealm, String clientId, String clientSecret, String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Missing refresh token");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        addClientAuth(form, clientId, clientSecret);
        form.add("grant_type", GRANT_TYPE_REFRESH);
        form.add("refresh_token", refreshToken);
        return callKeycloak(targetRealm, OidcEndpoint.TOKEN, form, "Failed to refresh token")
            .bodyToMono(AccessTokenResponse.class)
            .block(Duration.ofSeconds(5));
    }

    /**
     * Tries to refresh an end user's tokens using {@code grant_type=refresh_token} against the OIDC Token Endpoint.
     *
     * @param clientId     the client ID to authenticate as
     * @param clientSecret the client secret to authenticate with
     * @param refreshToken the user's refresh token
     * @return DTO with fresh access token, refresh token, and lifetimes or null if exception
     */
    private AccessTokenResponse tryRefreshTokensWithClient(
        String targetRealm,
        String clientId,
        String clientSecret,
        String refreshToken,
        List<String> failures
    ) {
        try {
            return refreshTokensWithClient(targetRealm, clientId, clientSecret, refreshToken);
        } catch (UnauthorizedException ex) {
            log.debug("Refresh with client {} on realm {} failed: {}", clientId, targetRealm, ex.getMessage());
            failures.add("client=" + clientId + ", realm=" + targetRealm + ": " + ex.getMessage());
            return null;
        }
    }

    private UnauthorizedException buildRefreshFailure(List<String> failures, String authorizedParty, Jwt jwt) {
        String issuer = jwt != null && jwt.getIssuer() != null ? jwt.getIssuer().toString() : "n/a";
        String azp = StringUtil.isBlank(authorizedParty) ? "n/a" : authorizedParty;
        String details = failures.isEmpty() ? "no downstream refresh attempt succeeded" : String.join(" | ", failures);
        return new UnauthorizedException("Unable to refresh (issuer=" + issuer + ", azp=" + azp + "): " + details);
    }

    private String determinePreferredRealm(Jwt accessJwt) {
        if (accessJwt == null || accessJwt.getIssuer() == null) {
            return this.externalRealm;
        }
        return realmFromIssuer(accessJwt.getIssuer().toString());
    }

    private String realmFromIssuer(String issuer) {
        String tumIssuer = realmIssuer(this.tumLoginRealm);
        if (tumIssuer.equals(issuer)) {
            return this.tumLoginRealm;
        }
        return this.externalRealm;
    }

    /**
     * Returns the fully qualified OIDC endpoint URL (token or logout) for the given realm.
     *
     * @param realm    Keycloak realm name to address
     * @param endpoint which OIDC endpoint to build the URL for
     * @return fully qualified URL of the endpoint on the given realm
     */
    private String endpointUrl(String realm, OidcEndpoint endpoint) {
        String endpointPath = (endpoint == OidcEndpoint.TOKEN) ? "token" : "logout";
        return keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/" + endpointPath;
    }

    private String getRealmFromJwt(Jwt jwt) {
        String issuer = jwt.getIssuer() != null ? jwt.getIssuer().toString() : "";
        if (realmIssuer(tumLoginRealm).equals(issuer)) {
            return tumLoginRealm;
        }
        return externalRealm;
    }

    private String realmIssuer(String realmName) {
        String baseUrl = keycloakUrl.endsWith("/") ? keycloakUrl.substring(0, keycloakUrl.length() - 1) : keycloakUrl;
        return baseUrl + "/realms/" + realmName;
    }

    private String getPasskeyClientId(Jwt jwt) {
        String authorizedParty = jwtService.getAuthorizedParty(jwt);
        return StringUtil.isBlank(authorizedParty) ? browserClientId : authorizedParty;
    }

    private boolean isPasskeyCredential(CredentialRepresentation credential) {
        String type = credential.getType();
        return "webauthn-passwordless".equalsIgnoreCase(type) || "webauthn".equalsIgnoreCase(type);
    }

    /**
     * Adds client authentication parameters (client_id and client_secret) to the form.
     */
    private void addClientAuth(MultiValueMap<String, String> form, String id, String secret) {
        form.add("client_id", id);
        form.add("client_secret", secret);
    }

    private String serverClientIdForRealm(String targetRealm) {
        return tumLoginRealm.equals(targetRealm) ? tumServerClientId : externalServerClientId;
    }

    private String serverClientSecretForRealm(String targetRealm) {
        return tumLoginRealm.equals(targetRealm) ? tumServerClientSecret : externalServerClientSecret;
    }

    private boolean isServerClient(String clientId) {
        return externalServerClientId.equals(clientId) || tumServerClientId.equals(clientId);
    }

    /**
     * POSTs an application/x-www-form-urlencoded form to the given OIDC endpoint and returns the prepared
     * {@link WebClient.ResponseSpec} with error mapping applied.
     */
    private WebClient.ResponseSpec callKeycloak(
        String realm,
        OidcEndpoint endpoint,
        MultiValueMap<String, String> form,
        String errorPrefix
    ) {
        try {
            return webClient
                .post()
                .uri(endpointUrl(realm, endpoint))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, r ->
                    r.bodyToMono(String.class).flatMap(b -> Mono.error(new UnauthorizedException(errorPrefix + ": " + b)))
                )
                .onStatus(HttpStatusCode::is5xxServerError, r ->
                    r.bodyToMono(String.class).flatMap(b -> Mono.error(new UnauthorizedException(errorPrefix + ": " + b)))
                );
        } catch (Exception e) {
            throw new UnauthorizedException(errorPrefix, e);
        }
    }

    /**
     * Validates and converts a Keycloak {@link AccessTokenResponse} into the a {@link AuthResponseDTO}.
     *
     * @param tokenResponse the token response from Keycloak (must contain an access token)
     * @return a DTO containing the access token, refresh token (can be empty), and lifetimes
     * @throws UnauthorizedException if the response is null or lacks an access token
     */
    private AuthResponseDTO getResponseFromToken(AccessTokenResponse tokenResponse) {
        if (tokenResponse == null || tokenResponse.getToken() == null) {
            throw new UnauthorizedException("Token response is invalid");
        }
        String refreshToken = tokenResponse.getRefreshToken() != null ? tokenResponse.getRefreshToken() : "";
        return new AuthResponseDTO(
            tokenResponse.getToken(),
            refreshToken,
            tokenResponse.getExpiresIn(),
            tokenResponse.getRefreshExpiresIn()
        );
    }

    /**
     * Internal OIDC endpoints used by this service.
     */
    private enum OidcEndpoint {
        TOKEN,
        LOGOUT,
    }
}
