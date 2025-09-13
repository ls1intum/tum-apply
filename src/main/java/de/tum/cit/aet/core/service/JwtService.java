package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
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
     * Extracts the 'authorized party' (azp) claim from the given JWT.
     *
     * @param jwt the Jwt from which to extract the claim
     * @return the authorized party as a String, or null if the Jwt is null
     */
    public String getAuthorizedParty(Jwt jwt) {
        return jwt == null ? null : jwt.getClaimAsString("azp");
    }

    /**
     * Calculates the number of seconds until the given JWT expires.
     *
     * @param jwt the Jwt to check
     * @return the number of seconds until expiry, or 0 if the Jwt is null or has no expiry
     */
    public int secondsUntilExpiry(Jwt jwt) {
        if (jwt == null || jwt.getExpiresAt() == null) return 0;
        return (int) Duration.between(Instant.now(), jwt.getExpiresAt()).getSeconds();
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
