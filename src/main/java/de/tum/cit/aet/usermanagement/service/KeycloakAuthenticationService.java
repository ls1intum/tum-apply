package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.core.service.JwtService;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import io.netty.channel.ChannelOption;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.authorization.client.AuthzClient;
import org.keycloak.authorization.client.Configuration;
import org.keycloak.representations.AccessTokenResponse;
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

import java.time.Duration;
import java.util.Map;

/**
 * Service for authenticating users against Keycloak and handling token lifecycle operations (password login,
 * refresh, logout, token exchange/impersonation).
 */
@Slf4j
@Service
public class KeycloakAuthenticationService {

    private static final String GRANT_TYPE_TOKEN_EXCHANGE = "urn:ietf:params:oauth:grant-type:token-exchange";
    private static final String GRANT_TYPE_REFRESH = "refresh_token";

    private final AuthzClient authzClient;

    private final String keycloakUrl;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    private final String adminClientId;
    private final String adminClientSecret;

    private final WebClient webClient;
    private final JwtService jwtService;

    public KeycloakAuthenticationService(@Value("${KEYCLOAK_URL:http://localhost:9080}") String keycloakUrl,
                                         @Value("${KEYCLOAK_REALM:tumapply}") String realm,
                                         @Value("${KEYCLOAK_SERVER_CLIENT_ID:server-client}") String clientId,
                                         @Value("${KEYCLOAK_SERVER_CLIENT_SECRET:my-secret}") String clientSecret,
                                         @Value("${KEYCLOAK_ADMIN_CLIENT_ID:tumapply-otp-admin}") String adminClientId,
                                         @Value("${KEYCLOAK_ADMIN_CLIENT_SECRET:tumapply-otp-secret}") String adminClientSecret, JwtService jwtService
    ) {
        this.authzClient = AuthzClient.create(new Configuration(
            keycloakUrl,
            realm,
            clientId,
            Map.of("secret", clientSecret),
            null
        ));

        this.keycloakUrl = keycloakUrl;
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;

        this.adminClientId = adminClientId;
        this.adminClientSecret = adminClientSecret;

        HttpClient httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(5))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 3000);

        this.webClient = WebClient.builder()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
        this.jwtService = jwtService;
    }

    /**
     * Authenticates an end user with email (username) and password using the OIDC password grant via
     * Keycloak's Authorization Client. Returns access/refresh tokens.
     *
     * @param email    user's email (username)
     * @param password user's password
     * @return DTO with access token, optional refresh token and lifetimes
     * @throws UnauthorizedException if authentication fails or response is invalid
     */
    public AuthResponseDTO loginWithCredentials(String email, String password) {
        try {
            AccessTokenResponse token = authzClient.obtainAccessToken(email, password);
            return getResponseFromToken(token);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid username or password", e);
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
            throw new UnauthorizedException("Missing refresh token");
        }

        if (!logoutWithClient(this.clientId, this.clientSecret, refreshToken)
            && !logoutWithClient(this.adminClientId, this.adminClientSecret, refreshToken)) {
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
        final Jwt jwt = jwtService.decode(accessToken);

        // 1) No refresh token: accept valid access token, else session expired
        if (StringUtil.isBlank(refreshToken)) {
            if (jwt != null && jwtService.isActive(jwt)) {
                return new AuthResponseDTO(accessToken, "", jwtService.secondsUntilExpiry(jwt), 0);
            }
            throw new UnauthorizedException("Session expired");
        }

        // 2) Valid access token present: choose path based on azp
        if (jwt != null && jwtService.isActive(jwt)) {
            final String authorizedParty = jwtService.getAuthorizedParty(jwt);
            if (clientId.equals(authorizedParty)) {
                // Default refresh with server client
                return getResponseFromToken(refreshTokensWithClient(clientId, clientSecret, refreshToken));
            }
            if (adminClientId.equals(authorizedParty)) {
                // Subject-only refresh via otp client
                final String subject = jwt.getSubject();
                if (StringUtil.isBlank(subject)) {
                    throw new UnauthorizedException("Access token missing subject");
                }
                return exchangeForUserTokens(subject);
            }
            throw new UnauthorizedException("Unauthorized client for refresh");
        }

        // 3) No valid access token: try to refresh with both clients
        AccessTokenResponse serverRefresh = tryRefreshTokensWithClient(clientId, clientSecret, refreshToken);
        if (serverRefresh != null) {
            return getResponseFromToken(serverRefresh);
        }

        AccessTokenResponse otpRefresh = tryRefreshTokensWithClient(adminClientId, adminClientSecret, refreshToken);
        if (otpRefresh != null) {
            Jwt otpJwt = jwtService.decode(otpRefresh.getToken());
            String keycloakUserId = otpJwt.getSubject();
            if (StringUtil.isBlank(keycloakUserId)) {
                throw new UnauthorizedException("Access token missing subject");
            }
            return exchangeForUserTokens(keycloakUserId);
        }

        throw new UnauthorizedException("Unable to refresh");
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
        form.add("audience", clientId);

        AccessTokenResponse tokenResponse = callKeycloak(OidcEndpoint.TOKEN, form, "Token exchange failed")
            .bodyToMono(AccessTokenResponse.class)
            .block(Duration.ofSeconds(5));
        return getResponseFromToken(tokenResponse);
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
    private boolean logoutWithClient(String clientId, String clientSecret, String refreshToken) {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            addClientAuth(form, clientId, clientSecret);
            form.add("refresh_token", refreshToken);
            callKeycloak(OidcEndpoint.LOGOUT, form, "Failed to logout user")
                .toBodilessEntity()
                .block(Duration.ofSeconds(5));
            return true;
        } catch (UnauthorizedException ex) {
            log.debug("Logout with client {} failed: {}", clientId, ex.getMessage());
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
    private AccessTokenResponse refreshTokensWithClient(String clientId, String clientSecret, String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Missing refresh token");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        addClientAuth(form, clientId, clientSecret);
        form.add("grant_type", GRANT_TYPE_REFRESH);
        form.add("refresh_token", refreshToken);
        return callKeycloak(OidcEndpoint.TOKEN, form, "Failed to refresh token")
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
    private AccessTokenResponse tryRefreshTokensWithClient(String clientId, String clientSecret, String refreshToken) {
        try {
            return refreshTokensWithClient(clientId, clientSecret, refreshToken);
        } catch (UnauthorizedException ex) {
            log.debug("Refresh with client {} failed: {}", clientId, ex.getMessage());
            return null;
        }
    }

    /**
     * Returns the fully qualified OIDC endpoint URL (token or logout) for the configured realm.
     */
    private String endpointUrl(OidcEndpoint endpoint) {
        String endpointPath = (endpoint == OidcEndpoint.TOKEN) ? "token" : "logout";
        return keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/" + endpointPath;
    }


    /**
     * Adds client authentication parameters (client_id and client_secret) to the form.
     */
    private void addClientAuth(MultiValueMap<String, String> form, String id, String secret) {
        form.add("client_id", id);
        form.add("client_secret", secret);
    }

    /**
     * POSTs an application/x-www-form-urlencoded form to the given OIDC endpoint and returns the prepared
     * {@link WebClient.ResponseSpec} with error mapping applied.
     */
    private WebClient.ResponseSpec callKeycloak(OidcEndpoint endpoint, MultiValueMap<String, String> form, String errorPrefix) {
        try {
            return webClient.post()
                .uri(endpointUrl(endpoint))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, r -> r.bodyToMono(String.class)
                    .flatMap(b -> Mono.error(new UnauthorizedException(errorPrefix + ": " + b))))
                .onStatus(HttpStatusCode::is5xxServerError, r -> r.bodyToMono(String.class)
                    .flatMap(b -> Mono.error(new UnauthorizedException(errorPrefix + ": " + b))));
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
        return new AuthResponseDTO(tokenResponse.getToken(), refreshToken, tokenResponse.getExpiresIn(), tokenResponse.getRefreshExpiresIn());
    }

    /**
     * Internal OIDC endpoints used by this service.
     */
    private enum OidcEndpoint {TOKEN, LOGOUT}
}
