package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Service for authenticating users against Keycloak and handling token lifecycle operations (password login,
 * refresh, logout, token exchange/impersonation).
 */
@Slf4j
@Service
public class KeycloakAuthenticationService {

    private final AuthzClient authzClient;

    private final String keycloakUrl;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    private final String adminClientId;
    private final String adminClientSecret;

    private final WebClient webClient;
    private final JwtDecoder jwtDecoder;

    public KeycloakAuthenticationService(@Value("${KEYCLOAK_URL:http://localhost:9080}") String keycloakUrl,
                                         @Value("${KEYCLOAK_REALM:tumapply}") String realm,
                                         @Value("${KEYCLOAK_SERVER_CLIENT_ID:server-client}") String clientId,
                                         @Value("${KEYCLOAK_SERVER_CLIENT_SECRET:my-secret}") String clientSecret,
                                         @Value("${KEYCLOAK_ADMIN_CLIENT_ID:tumapply-otp-admin}") String adminClientId,
                                         @Value("${KEYCLOAK_ADMIN_CLIENT_SECRET:tumapply-otp-secret}") String adminClientSecret
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

        this.jwtDecoder = NimbusJwtDecoder.withJwkSetUri(jwksUrl()).build();
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
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        addClientAuth(form, clientId, clientSecret);
        form.add("refresh_token", refreshToken);
        callKeycloak(OidcEndpoint.LOGOUT, form, "Failed to logout user").toBodilessEntity().block(Duration.ofSeconds(5));
    }

    /**
     * Refreshes an end user's tokens using {@code grant_type=refresh_token} against the OIDC Token Endpoint.
     *
     * @param refreshToken the user's refresh token
     * @return DTO with fresh access token, refresh token, and lifetimes
     * @throws UnauthorizedException if the request is rejected or fails
     */
    public AuthResponseDTO refreshTokens(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Missing refresh token");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        addClientAuth(form, clientId, clientSecret);
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refreshToken);
        AccessTokenResponse tokenResponse = callKeycloak(OidcEndpoint.TOKEN, form, "Failed to refresh token").bodyToMono(AccessTokenResponse.class).block(Duration.ofSeconds(5));
        return getResponseFromToken(tokenResponse);
    }

    /**
     * Refreshes tokens using the provided client credentials (used when the incoming tokens belong to a different azp).
     */
    private AuthResponseDTO refreshTokensWithClient(String overrideClientId, String overrideClientSecret, String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Missing refresh token");
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        addClientAuth(form, overrideClientId, overrideClientSecret);
        form.add("grant_type", "refresh_token");
        form.add("refresh_token", refreshToken);
        AccessTokenResponse tokenResponse = callKeycloak(OidcEndpoint.TOKEN, form, "Failed to refresh token").bodyToMono(AccessTokenResponse.class).block(Duration.ofSeconds(5));
        return getResponseFromToken(tokenResponse);
    }

    /**
     * Uses Spring Security's authenticated principal (a validated Jwt) to obtain the user's subject,
     * then performs a subject-only Token Exchange (impersonation) to mint tokens for {@code clientId}.
     * <p>
     * Requires that the calling controller endpoint is secured so that only a valid, non-expired Jwt
     * reaches this method. No subject_token is sent to Keycloak; permissions must allow the admin client
     * to impersonate the requested subject and to exchange to the audience {@code clientId}.
     */
    public AuthResponseDTO exchangeForCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new UnauthorizedException("Missing or invalid authentication");
        }
        String subject = jwt.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new UnauthorizedException("Authenticated token has no subject");
        }
        return exchangeForUserTokens(subject);
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
    public AuthResponseDTO normalizeTokensForServer(String accessToken, String refreshToken) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new UnauthorizedException("Missing access token");
        }
        final Jwt jwt;
        try {
            jwt = jwtDecoder.decode(accessToken);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid access token", e);
        }

        final String subject = jwt.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new UnauthorizedException("Access token has no subject");
        }

        final String azp = jwt.getClaimAsString("azp");
        final boolean azpMatchesServerClient = clientId.equals(azp);

        // Helper to check current access token expiry
        final boolean accessTokenExpired = jwt.getExpiresAt() != null && jwt.getExpiresAt().isBefore(Instant.now());

        // Case A: Tokens already belong to the application client (azp == server-client)
        if (azpMatchesServerClient) {
            // Prefer a standard refresh to keep TTL semantics intact.
            if (refreshToken != null && !refreshToken.isBlank()) {
                try {
                    return refreshTokens(refreshToken);
                } catch (UnauthorizedException ex) {
                    // Refresh failed (likely invalid_grant/expired). Do NOT silently impersonate.
                    throw ex;
                }
            }
            // No refresh token provided. If the access token is still valid, we can mint a fresh pair via exchange.
            if (!accessTokenExpired) {
                return exchangeForUserTokens(subject);
            }
            // Access token expired and no refresh token available -> invalid session.
            throw new UnauthorizedException("Session expired");
        }

        // Case B: Tokens belong to a different client (e.g., the OTP/admin client).
        // We only impersonate if the presented session is still valid.
        if (refreshToken != null && !refreshToken.isBlank()) {
            try {
                // Verify session validity by attempting a refresh with the issuing client (admin/OTP).
                refreshTokensWithClient(adminClientId, adminClientSecret, refreshToken);
            } catch (UnauthorizedException ex) {
                // Refresh failed -> session not valid anymore. Do NOT impersonate.
                throw new UnauthorizedException("Session expired or invalid (issuer refresh failed)");
            }
            // Refresh succeeded -> proceed to subject-only exchange to our application client.
            return exchangeForUserTokens(subject);
        }

        // No refresh token available. Fall back to access-token expiry check:
        if (!accessTokenExpired) {
            // Access token still valid -> allow subject-only exchange to server client.
            return exchangeForUserTokens(subject);
        }

        // Access token expired and no refresh token to prove session validity -> reject.
        throw new UnauthorizedException("Session expired");
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
        form.add("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
        form.add("requested_subject", keycloakUserId);
        form.add("audience", clientId);

        AccessTokenResponse tokenResponse = callKeycloak(OidcEndpoint.TOKEN, form, "Token exchange failed").bodyToMono(AccessTokenResponse.class).block(Duration.ofSeconds(5));
        return getResponseFromToken(tokenResponse);
    }

    // ===== Helpers =====

    /**
     * Returns the fully qualified OIDC endpoint URL (token or logout) for the configured realm.
     */
    private String endpointUrl(OidcEndpoint endpoint) {
        String endpointPath = (endpoint == OidcEndpoint.TOKEN) ? "token" : "logout";
        return keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/" + endpointPath;
    }

    /**
     * Returns the JWKS URL for the configured realm to validate incoming JWTs locally.
     */
    private String jwksUrl() {
        return keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/certs";
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
