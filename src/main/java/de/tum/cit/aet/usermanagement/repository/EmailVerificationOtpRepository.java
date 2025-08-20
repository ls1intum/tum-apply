package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface EmailVerificationOtpRepository extends JpaRepository<EmailVerificationOtp, UUID> {

    @Query("""
            select e from EmailVerificationOtp e
             where e.email = :email
               and e.used = false
               and e.expiresAt > :now
             order by e.createdAt desc
        """)
    List<EmailVerificationOtp> findActiveByEmail(@Param("email") String email, @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update EmailVerificationOtp e set e.used = true where e.email = :email and e.id <> :keepId and e.used = false")
    int invalidateOthers(@Param("email") String email, @Param("keepId") UUID keepId);
}
