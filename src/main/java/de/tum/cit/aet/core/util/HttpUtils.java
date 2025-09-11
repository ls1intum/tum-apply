package de.tum.cit.aet.core.util;

import jakarta.servlet.http.HttpServletRequest;

public class HttpUtils {
    /**
     * Resolves the client's IP address from the HTTP request.
     * Prefers the 'X-Forwarded-For' header if present to handle proxies,
     * otherwise falls back to the remote address.
     *
     * @param request the HTTP servlet request
     * @return the resolved client IP address as a String
     */
    public static String getClientIp(HttpServletRequest request) {
        String header = request.getHeader("X-Forwarded-For");
        if (header != null && !header.isBlank()) {
            return header.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
