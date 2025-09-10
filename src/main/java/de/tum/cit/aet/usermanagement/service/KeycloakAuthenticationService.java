package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import io.netty.channel.ChannelOption;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.authorization.client.AuthzClient;
import org.keycloak.authorization.client.Configuration;
import org.keycloak.representations.AccessTokenResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
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

    private final AuthzClient authzClient;
    private final Keycloak adminClient;

    private final String keycloakUrl;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    private final String adminClientId;
    private final String adminClientSecret;

    private final WebClient webClient;

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
        this.adminClient = KeycloakBuilder.builder()
            .serverUrl(keycloakUrl)
            .realm(realm)
            .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
            .clientId(adminClientId)
            .clientSecret(adminClientSecret)
            .build();

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
     * Exchanges the service-account token for end-user tokens using the OIDC Token Exchange grant (impersonation).
     *
     * @param keycloakUserId the target user's Keycloak ID (UUID)
     * @return DTO with access token and optional refresh token
     * @throws UnauthorizedException if obtaining the admin token or the exchange request fails
     */
    public AuthResponseDTO exchangeForUserTokens(String keycloakUserId) {
        String adminAccessToken;
        try {
            adminAccessToken = adminClient.tokenManager().getAccessTokenString();
        } catch (Exception e) {
            throw new UnauthorizedException("Failed to obtain service-account token via Keycloak client", e);
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        addClientAuth(form, adminClientId, adminClientSecret);
        form.add("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange");
        form.add("subject_token", adminAccessToken);
        form.add("requested_subject", keycloakUserId);
        form.add("requested_token_type", "urn:ietf:params:oauth:token-type:access_token");
        form.add("scope", "openid");

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
