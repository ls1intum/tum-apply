package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.core.util.CookieUtils;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import de.tum.cit.aet.usermanagement.dto.auth.AuthSessionInfoDTO;
import de.tum.cit.aet.usermanagement.dto.auth.LoginRequestDTO;
import de.tum.cit.aet.usermanagement.service.KeycloakAuthenticationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Sets authentication cookies based on tokens.
 */
@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class AuthenticationResource {

    private final KeycloakAuthenticationService keycloakAuthenticationService;

    /**
     * Authenticates a user via email and password and sets an access token as an HttpOnly cookie.
     *
     * @param loginRequest the DTO containing the user's email and password
     * @param response     the HTTP servlet response used to set the authentication cookie
     * @return HTTP 200 OK if login is successful and the cookie is set
     * @throws UnauthorizedException if login credentials are invalid
     */
    @PostMapping("/login")
    public AuthSessionInfoDTO login(@Valid @RequestBody LoginRequestDTO loginRequest, HttpServletResponse response) {
        AuthResponseDTO tokens = keycloakAuthenticationService.loginWithCredentials(loginRequest.email(), loginRequest.password());
        CookieUtils.setAuthCookies(response, tokens);
        return new AuthSessionInfoDTO(tokens.expiresIn(), tokens.refreshExpiresIn());
    }

    /**
     * Logs out the user by invalidating the refresh token at Keycloak and clearing authentication cookies.
     *
     * @param request  the HTTP servlet request containing the refresh_token cookie
     * @param response the HTTP servlet response used to clear authentication cookies
     * @return HTTP 200 OK if logout is successful
     * @throws UnauthorizedException if the refresh token is missing or logout fails
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("refresh_token".equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }
        if (refreshToken == null) {
            throw new UnauthorizedException("Refresh token is missing for logout");
        }
        keycloakAuthenticationService.invalidateRefreshToken(refreshToken);

        CookieUtils.setAuthCookies(response, null);
        return ResponseEntity.ok().build();
    }

    /**
     * Refreshes authentication cookies using the refresh token cookie.
     *
     * @param request  the HTTP servlet request containing the refresh_token cookie
     * @param response the HTTP servlet response used to set new authentication cookies
     * @return HTTP 200 OK if refresh is successful
     * @throws UnauthorizedException if the refresh token is missing or invalid
     */
    @PostMapping("/refresh")
    public AuthSessionInfoDTO refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("refresh_token".equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }
        if (refreshToken == null) {
            throw new UnauthorizedException("Refresh token is missing");
        }
        AuthResponseDTO tokens = keycloakAuthenticationService.refreshTokens(refreshToken);

        CookieUtils.setAuthCookies(response, tokens);
        return new AuthSessionInfoDTO(tokens.expiresIn(), tokens.refreshExpiresIn());
    }
}
