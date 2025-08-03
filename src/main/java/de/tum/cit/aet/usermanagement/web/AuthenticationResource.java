package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.usermanagement.dto.AuthResponseDTO;
import de.tum.cit.aet.usermanagement.dto.LoginRequestDTO;
import de.tum.cit.aet.usermanagement.service.KeycloakAuthenticationService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.Map;

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
    public ResponseEntity<Map<String, Long>> login(@Valid @RequestBody LoginRequestDTO loginRequest, HttpServletResponse response) {
        AuthResponseDTO tokens = keycloakAuthenticationService.loginWithCredentials(loginRequest.email(), loginRequest.password());

        ResponseCookie accessCookie = ResponseCookie.from("access_token", tokens.accessToken())
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofSeconds(tokens.expiresIn()))
            .build();
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", tokens.refreshToken())
            .httpOnly(true)
            .secure(true)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofSeconds(tokens.refreshExpiresIn()))
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        // Return the token expiry durations to the client
        return ResponseEntity.ok(Map.of("expiresIn", tokens.expiresIn(), "refreshExpiresIn", tokens.refreshExpiresIn()));
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

        // Clear cookies by setting maxAge=0
        ResponseCookie clearAccess = ResponseCookie.from("access_token", "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(0)
            .build();
        ResponseCookie clearRefresh = ResponseCookie.from("refresh_token", "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Lax")
            .path("/")
            .maxAge(0)
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, clearAccess.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, clearRefresh.toString());
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
    public ResponseEntity<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
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

        ResponseCookie accessCookie = ResponseCookie.from("access_token", tokens.accessToken())
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofSeconds(tokens.expiresIn()))
            .build();
        ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", tokens.refreshToken())
            .httpOnly(true)
            .secure(true)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofSeconds(tokens.refreshExpiresIn()))
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        return ResponseEntity.ok().build();
    }
}
