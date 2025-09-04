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
     * Returns the most recent active OTP for the given email.
     * An OTP is considered active if {@code used=false} and {@code expiresAt > now}.
     * The method relies on an index over (email, used, expires_at) to be efficient.
     *
     * @param email the email to search for (normalized)
     * @param now   the current timestamp used for the expiry comparison
     * @return the newest matching OTP, if present
     */
    Optional<EmailVerificationOtp> findTop1ByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
        String email,
        Instant now
    );

    /**
     * Invalidates all currently active OTPs for the given email by setting {@code used=true}.
     * Call this before creating a new OTP to enforce the single-active-code policy.
     *
     * @param email the email whose active OTPs should be invalidated
     * @return number of rows updated
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EmailVerificationOtp e set e.used = true where e.email = :email and e.used = false")
    int invalidateAllForEmail(@Param("email") String email);

    /**
     * Fast existence check for an active OTP without loading an entity.
     *
     * @param email the email to check
     * @param now   the current timestamp used for the expiry comparison
     * @return {@code true} if at least one active OTP exists; {@code false} otherwise
     */
    boolean existsByEmailAndUsedFalseAndExpiresAtAfter(String email, Instant now);

    /**
     * Atomically marks a specific OTP as used if it is still active at the time of update.
     *
     * @param id  the OTP identifier
     * @param now the current timestamp used for the expiry comparison
     * @return number of rows updated (0 if already used/expired/not found)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EmailVerificationOtp e set e.used = true where e.id = :id and e.used = false and e.expiresAt > :now")
    int markUsedIfActive(@Param("id") UUID id, @Param("now") Instant now);

    /**
     * Atomically increments the {@code attempts} counter for the given OTP if it is still active.
     * If the increment reached or exceed {@code maxAttempts}, the OTP is burned in the same statement by setting
     * {@code used=true}. This avoids races between parallel verifications.
     *
     * @param id  the OTP identifier
     * @param now the current timestamp used for the expiry comparison
     * @return number of rows updated (0 if already used/expired/not found)
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EmailVerificationOtp e set e.attempts = e.attempts + 1, e.used = (case when e.attempts >= e.maxAttempts then true else e.used end) where e.id = :id and e.used = false and e.expiresAt > :now")
    int incrementAttemptsIfActive(@Param("id") UUID id, @Param("now") Instant now);

    /**
     * Deletes all OTPs that are already used or expired.
     * Intended for scheduled cleanup jobs and relies on an index over {@code expires_at} for efficiency.
     *
     * @param now the current timestamp used for the expiry comparison
     * @return number of rows deleted
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from EmailVerificationOtp e where e.used = true or e.expiresAt < :now")
    int purgeUsedOrExpired(@Param("now") Instant now);
}
