package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;

/**
 * Service for handling JWT operations such as decoding and extracting claims.
 */
@Service
public class JwtService {
    private final JwtDecoder decoder;
    private final JwtDecoder refreshTokenDecoder;

    public JwtService(
        JwtDecoder decoder,
        @Value("${KEYCLOAK_ADMIN_CLIENT_SECRET:tumapply-otp-secret}") String adminClientSecret,
        @Value("${KEYCLOAK_SERVER_CLIENT_ID:server-client}") String clientId
    ) {
        this.decoder = decoder;
        this.refreshTokenDecoder = (adminClientSecret == null || adminClientSecret.isBlank())
            ? null
            : NimbusJwtDecoder.withSecretKey(new SecretKeySpec(adminClientSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"))
            .macAlgorithm(MacAlgorithm.HS256)
            .build();
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
     * Decodes the given JWT refresh token string.
     *
     * @param refreshToken the JWT token string
     * @return the decoded  Jwt, or null if the token is null or blank
     * @throws UnauthorizedException if the token is invalid
     */
    public Jwt decodeRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) return null;
        try {
            return refreshTokenDecoder.decode(refreshToken);
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid refresh token", e);
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
