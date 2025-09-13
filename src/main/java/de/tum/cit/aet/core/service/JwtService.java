package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {
    private final JwtDecoder decoder;

    public JwtService(JwtDecoder decoder) {
        this.decoder = decoder;
    }

    /**
     * Decodes the given JWT token string.
     *
     * @param token the JWT token string
     * @return the decoded Jwt, or null if the token is null or blank
     * @throws UnauthorizedException if the token is invalid
     */
    public Jwt decode(String token) {
        if (token == null || token.isBlank()) return null;
        try {
            return decoder.decode(token);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid token", e);
        }
    }

    /**
     * Extracts the "azp" (authorized party) claim from the given JWTs.
     * Prefers the access token's claim, but falls back to the refresh token's claim if the access token is missing.
     *
     * @param accessJwt  the access token Jwt
     * @param refreshJwt the refresh token Jwt
     * @return the "azp" claim value
     * @throws UnauthorizedException if both tokens are missing
     */
    public String getAuthorizedParty(Jwt accessJwt, Jwt refreshJwt) {
        if (accessJwt != null) return accessJwt.getClaimAsString("azp");
        if (refreshJwt != null) return refreshJwt.getClaimAsString("azp");
        throw new UnauthorizedException("Missing access and refresh token");
    }

    /**
     * Extracts the subject (user ID) from the given JWTs.
     * Prefers the access token's subject, but falls back to the refresh token's subject if the access token is missing.
     *
     * @param accessJwt  the access token Jwt
     * @param refreshJwt the refresh token Jwt
     * @return the subject (user ID)
     * @throws UnauthorizedException if both tokens are missing
     */
    public String getSubject(Jwt accessJwt, Jwt refreshJwt) {
        if (accessJwt != null) return accessJwt.getSubject();
        if (refreshJwt != null) return refreshJwt.getSubject();
        throw new UnauthorizedException("Missing access and refresh token");
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
