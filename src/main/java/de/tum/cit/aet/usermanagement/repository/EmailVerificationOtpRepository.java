package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository enforcing a single-active-OTP-per-email policy and optimized lookups.
 */
public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, UUID> {

    /**
     * Returns the most recent active (non-used, non-expired) OTP for the given email.
     */
    Optional<EmailVerificationOtp> findTop1ByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
        String email,
        Instant now
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EmailVerificationOtp e set e.used = true where e.email = :email and e.used = false")
    int invalidateAllForEmail(@Param("email") String email);
}
