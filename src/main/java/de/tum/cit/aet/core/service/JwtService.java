package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service for handling JWT operations such as decoding and extracting claims.
 */
@Service
public class JwtService {
    private final JwtDecoder decoder;

    public JwtService(JwtDecoder decoder) {
        this.decoder = decoder;
    }

    /**
     * Decodes the given JWT access token string.
     *
     * @param accessToken the JWT token string
     * @return the decoded  Jwt, or null if the token is null or blank
     * @throws UnauthorizedException if the token is invalid
     */
    public Jwt decode(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) return null;
        try {
            return decoder.decode(accessToken);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid access token", e);
        }
    }

    /**
     * Checks if the given access token is active (not expired).
     *
     * @param jwt the access token Jwt
     * @return true if the token is active, false otherwise
     */
    public boolean isActive(Jwt jwt) {
        return jwt != null && jwt.getExpiresAt() != null && Instant.now().isBefore(jwt.getExpiresAt());
    }
}
