package de.tum.cit.aet.core.util;

import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import java.time.Duration;

/**
 * Helpers for writing and clearing cookies.
 */
public class CookieUtils {
    private CookieUtils() {
    }

    /**
     * Sets or clears authentication cookies. If {@code tokens} is non-null, new cookies are set;
     * if {@code null}, existing cookies are cleared.
     *
     * @param response the HTTP response to append {@code Set-Cookie} headers to
     * @param tokens   token payload (access & refresh); {@code null} clears cookies
     */
    public static void setAuthCookies(HttpServletResponse response, AuthResponseDTO tokens) {
        if (tokens != null) {
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
        } else {
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
        }
    }
}
