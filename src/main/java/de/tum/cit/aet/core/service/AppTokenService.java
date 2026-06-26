package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.dto.AppTokenProperties;
import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.usermanagement.domain.AppRefreshToken;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import de.tum.cit.aet.usermanagement.repository.AppRefreshTokenRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Mints and validates the JWTs that TUMApply issues for applicants (replacing Keycloak token exchange
 * for the external-login realm). Access and refresh tokens are RS256-signed with the application's own
 * key; refresh tokens are additionally tracked in {@link AppRefreshTokenRepository} so they can be
 * revoked on logout and rotated (with replay detection) on use.
 * <p>
 * Access-token claims are kept compatible with the existing resource-server pipeline: {@code sub} is the
 * local {@link User#getUserId()} (consumed by {@code CurrentUserService} and {@code AuthenticationService}),
 * plus {@code email}, {@code given_name}, {@code family_name} and {@code azp}.
 */
@Slf4j
@Service
public class AppTokenService {

    private static final String CLAIM_TYPE = "typ";
    private static final String CLAIM_AZP = "azp";
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final JwtEncoder appJwtEncoder;
    private final JwtDecoder appRefreshTokenDecoder;
    private final AppRefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final ConcurrentMap<String, CompletableFuture<AuthResponseDTO>> inFlightRefreshes = new ConcurrentHashMap<>();

    private final TransactionTemplate transactionTemplate;
    private final String issuer;
    private final String kid;
    private final String azp;
    private final long accessTtlSeconds;
    private final long refreshTtlSeconds;

    public AppTokenService(
        JwtEncoder appJwtEncoder,
        @Qualifier("appRefreshTokenDecoder") JwtDecoder appRefreshTokenDecoder,
        AppRefreshTokenRepository refreshTokenRepository,
        UserRepository userRepository,
        PlatformTransactionManager transactionManager,
        AppTokenProperties properties
    ) {
        this.appJwtEncoder = appJwtEncoder;
        this.appRefreshTokenDecoder = appRefreshTokenDecoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
        this.issuer = properties.issuer();
        this.kid = properties.kid();
        this.azp = properties.azp();
        this.accessTtlSeconds = properties.accessTtlSeconds();
        this.refreshTtlSeconds = properties.refreshTtlSeconds();
    }

    /**
     * Issues a fresh access + refresh token pair for the given (already-provisioned) user and records the
     * refresh token's id so it can later be revoked.
     *
     * @param user the local user to authenticate; must have a {@code userId}
     * @return tokens and their lifetimes, shaped for {@code CookieUtils.setAuthCookies}
     */
    @Transactional
    public AuthResponseDTO issueFor(User user) {
        Instant now = Instant.now();
        String accessToken = mintAccessToken(user, now);
        String refreshJti = UUID.randomUUID().toString();
        String refreshToken = mintRefreshToken(user, refreshJti, now);

        AppRefreshToken record = new AppRefreshToken();
        record.setJti(refreshJti);
        record.setUserId(user.getUserId());
        record.setCreatedAt(now);
        record.setExpiresAt(now.plusSeconds(refreshTtlSeconds));
        refreshTokenRepository.save(record);

        return new AuthResponseDTO(accessToken, refreshToken, accessTtlSeconds, refreshTtlSeconds);
    }

    /**
     * Validates a refresh token and rotates it: the presented token is atomically revoked and a new pair is
     * issued. Reuse of an already-revoked token (or losing the atomic claim) is treated as theft and revokes
     * every active token for that user.
     * <p>
     * Concurrent calls with the SAME refresh token are de-duplicated and share a single rotation result, so
     * legitimate parallel requests (e.g. the cookie {@code BearerTokenResolver} auto-refresh firing on several
     * in-flight requests at access-token expiry) do not trip replay detection and log the user out.
     *
     * @param refreshToken the refresh token from the client's cookie
     * @return a freshly issued token pair
     * @throws UnauthorizedException if the token is invalid, expired, unknown, or revoked
     */
    public AuthResponseDTO refresh(String refreshToken) {
        CompletableFuture<AuthResponseDTO> pending = new CompletableFuture<>();
        CompletableFuture<AuthResponseDTO> inFlight = inFlightRefreshes.putIfAbsent(refreshToken, pending);
        if (inFlight != null) {
            return awaitInFlight(inFlight);
        }
        try {
            AuthResponseDTO result = transactionTemplate.execute(status -> rotate(refreshToken));
            pending.complete(result);
            return result;
        } catch (RuntimeException ex) {
            pending.completeExceptionally(ex);
            throw ex;
        } finally {
            inFlightRefreshes.remove(refreshToken, pending);
        }
    }

    private AuthResponseDTO rotate(String refreshToken) {
        Jwt jwt = decodeRefreshToken(refreshToken);
        String jti = jwt.getId();
        UUID userId = parseSubject(jwt);

        AppRefreshToken record = refreshTokenRepository.findById(jti).orElseThrow(() -> new UnauthorizedException("Unknown refresh token"));

        // Atomically claim the token; if it was already revoked (or another request claimed it first), treat
        // the reuse as theft and revoke the whole family.
        if (record.isRevoked() || refreshTokenRepository.revokeIfActive(jti) == 0) {
            refreshTokenRepository.revokeAllForUser(userId);
            log.warn("Refresh token replay detected for user {}; revoked all sessions", userId);
            throw new UnauthorizedException("Refresh token already used");
        }

        User user = userRepository.findById(userId).orElseThrow(() -> new UnauthorizedException("User no longer exists"));
        return issueFor(user);
    }

    private AuthResponseDTO awaitInFlight(CompletableFuture<AuthResponseDTO> inFlight) {
        try {
            return inFlight.join();
        } catch (CompletionException ex) {
            Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
            if (cause instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw new UnauthorizedException("Refresh failed", cause);
        }
    }

    /**
     * Revokes the given refresh token (logout). No-op if the token is invalid or already revoked.
     *
     * @param refreshToken the refresh token to revoke
     */
    @Transactional
    public void revoke(String refreshToken) {
        try {
            Jwt jwt = decodeRefreshToken(refreshToken);
            refreshTokenRepository.revokeIfActive(jwt.getId());
        } catch (UnauthorizedException ex) {
            log.debug("Ignoring revoke of invalid refresh token: {}", ex.getMessage());
        }
    }

    /**
     * Revokes every active refresh token for a user (e.g. global sign-out).
     *
     * @param userId the user whose tokens should be revoked
     */
    @Transactional
    public void revokeAllForUser(UUID userId) {
        refreshTokenRepository.revokeAllForUser(userId);
    }

    /**
     * @return the configured issuer URI used for app-minted tokens
     */
    public String getIssuer() {
        return issuer;
    }

    private String mintAccessToken(User user, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(issuer)
            .subject(user.getUserId().toString())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(accessTtlSeconds))
            .id(UUID.randomUUID().toString())
            .claim(CLAIM_AZP, azp)
            .claim(CLAIM_TYPE, TYPE_ACCESS)
            .claim("email", Objects.requireNonNullElse(user.getEmail(), ""))
            .claim("given_name", Objects.requireNonNullElse(user.getFirstName(), ""))
            .claim("family_name", Objects.requireNonNullElse(user.getLastName(), ""))
            .build();
        return encode(claims);
    }

    private String mintRefreshToken(User user, String jti, Instant now) {
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer(issuer)
            .subject(user.getUserId().toString())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(refreshTtlSeconds))
            .id(jti)
            .claim(CLAIM_AZP, azp)
            .claim(CLAIM_TYPE, TYPE_REFRESH)
            .build();
        return encode(claims);
    }

    private String encode(JwtClaimsSet claims) {
        JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).keyId(kid).build();
        return appJwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private Jwt decodeRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new UnauthorizedException("Missing refresh token");
        }
        Jwt jwt;
        try {
            jwt = appRefreshTokenDecoder.decode(refreshToken);
        } catch (JwtException ex) {
            throw new UnauthorizedException("Invalid refresh token", ex);
        }
        if (!TYPE_REFRESH.equals(jwt.getClaimAsString(CLAIM_TYPE))) {
            throw new UnauthorizedException("Token is not a refresh token");
        }
        return jwt;
    }

    private UUID parseSubject(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new UnauthorizedException("Refresh token has an invalid subject", ex);
        }
    }
}
