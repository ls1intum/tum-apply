package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for the {@link EmailVerificationOtp} entity.
 * Repository enforcing a single-active-OTP-per-email policy and optimized lookups.
 */
@Repository
public interface EmailVerificationOtpRepository extends TumApplyJpaRepository<EmailVerificationOtp, UUID> {

    /**
     * Returns the most recent active (non-used, non-expired) OTP for the given email.
     */
    Optional<EmailVerificationOtp> findTop1ByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
        String email,
        Instant now
    );

    /**
     * Marks all currently active (unused) OTPs for the given email as used.
     * Ensures that a new OTP request invalidates all older codes, enforcing the single-active-code policy.
     *
     * @param email The email address whose existing OTPs should be invalidated.
     * @return The number of OTP records updated.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EmailVerificationOtp e set e.used = true where e.email = :email and e.used = false")
    int invalidateAllForEmail(@Param("email") String email);

    /**
     * Fast existence check used by guards – avoids loading an entity when only a boolean is needed.
     */
    boolean existsByEmailAndUsedFalseAndExpiresAtAfter(String email, Instant now);

    /**
     * Atomically marks an OTP as used if it is still active at the time of update.
     *
     * @return number of rows updated (0 if already used/expired/not found).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EmailVerificationOtp e set e.used = true where e.id = :id and e.used = false and e.expiresAt > :now")
    int markUsedIfActive(@Param("id") UUID id, @Param("now") Instant now);

    /**
     * Atomically increments attempts for the given OTP if it is still active at the time of update.
     * If the increment reached or exceed maxAttempts, the OTP is burned (used=true) in the same statement.
     *
     * @return number of rows updated (0 if already used/expired/not found).
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EmailVerificationOtp e set e.attempts = e.attempts + 1, e.used = (case when e.attempts >= e.maxAttempts then true else e.used end) where e.id = :id and e.used = false and e.expiresAt > :now")
    int incrementAttemptsIfActive(@Param("id") UUID id, @Param("now") Instant now);

    /**
     * Purges used or expired OTP rows; intended for the scheduled cleanup.
     * Returns number of deleted rows.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from EmailVerificationOtp e where e.used = true or e.expiresAt < :now")
    int purgeUsedOrExpired(@Param("now") Instant now);
}
