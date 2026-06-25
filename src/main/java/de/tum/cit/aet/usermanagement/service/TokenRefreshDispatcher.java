package de.tum.cit.aet.usermanagement.service;

import com.nimbusds.jwt.JWTParser;
import de.tum.cit.aet.core.service.AppTokenService;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import java.text.ParseException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Routes token refresh and logout to the correct backend based on the token's issuer:
 * app-issued tokens are handled by {@link AppTokenService}, while TUM Keycloak tokens are handled by
 * {@link KeycloakAuthenticationService}. This lets the cookie-based session model serve both applicant
 * (self-issued) sessions and TUM staff (Keycloak) sessions transparently.
 */
@Service
public class TokenRefreshDispatcher {

    private final AppTokenService appTokenService;
    private final KeycloakAuthenticationService keycloakAuthenticationService;
    private final String appIssuer;

    public TokenRefreshDispatcher(
        AppTokenService appTokenService,
        KeycloakAuthenticationService keycloakAuthenticationService,
        @Value("${app.token.issuer}") String appIssuer
    ) {
        this.appTokenService = appTokenService;
        this.keycloakAuthenticationService = keycloakAuthenticationService;
        this.appIssuer = appIssuer;
    }

    /**
     * Refreshes a session, choosing the issuer-appropriate mechanism.
     *
     * @param accessToken  the current (possibly absent/expired) access token
     * @param refreshToken the refresh token
     * @return a freshly issued token pair
     */
    public AuthResponseDTO refresh(String accessToken, String refreshToken) {
        if (isAppToken(accessToken) || (isBlank(accessToken) && isAppToken(refreshToken))) {
            return appTokenService.refresh(refreshToken);
        }
        return keycloakAuthenticationService.refreshTokens(accessToken, refreshToken);
    }

    /**
     * Invalidates a session, choosing the issuer-appropriate mechanism.
     *
     * @param accessToken  the current access token (used only to determine the issuer)
     * @param refreshToken the refresh token to invalidate
     */
    public void logout(String accessToken, String refreshToken) {
        if (isAppToken(accessToken) || isAppToken(refreshToken)) {
            appTokenService.revoke(refreshToken);
            return;
        }
        keycloakAuthenticationService.invalidateRefreshToken(refreshToken);
    }

    private boolean isAppToken(String token) {
        return appIssuer.equals(issuerOf(token));
    }

    private String issuerOf(String token) {
        if (isBlank(token)) {
            return null;
        }
        try {
            return JWTParser.parse(token).getJWTClaimsSet().getIssuer();
        } catch (ParseException e) {
            return null;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
