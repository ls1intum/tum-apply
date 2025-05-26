package de.tum.cit.aet.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Filter to redirect all requests to the Single Page Application (SPA) index.html (we are not talking about wellness here 😉).
 */
public class SpaWebFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        String path = request.getRequestURI();
        // @formatter:off
        if (
            !path.startsWith("/api") &&
            !path.startsWith("/management") &&
            !path.startsWith("/time") &&
            !path.startsWith("/public") &&
            !path.startsWith("/git") &&
            !path.contains(".") &&
            path.matches("/(.*)")
        ) {
            // @formatter:on
            request.getRequestDispatcher("/").forward(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
