package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.config.OtpProperties;
import de.tum.cit.aet.core.security.otp.OtpUtil;
import de.tum.cit.aet.core.service.EmailService;
import de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp;
import de.tum.cit.aet.usermanagement.repository.EmailVerificationOtpRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class EmailVerificationService {
    private final OtpProperties otpProperties;
    private final EmailVerificationOtpRepository emailVerificationOtpRepository;
    private final EmailService emailService;
    private final KeycloakUserService keycloakUserService;

    public EmailVerificationService(OtpProperties otpProperties,
                                    EmailVerificationOtpRepository emailVerificationOtpRepository,
                                    EmailService emailService,
                                    KeycloakUserService keycloakUserService) {
        this.otpProperties = otpProperties;
        this.emailVerificationOtpRepository = emailVerificationOtpRepository;
        this.emailService = emailService;
        this.keycloakUserService = keycloakUserService;
    }

    @Transactional
    public void sendCode(String rawEmail, String ip) {
        String email = OtpUtil.normalizeEmail(rawEmail);

        // Enforce single-active-code policy
        emailVerificationOtpRepository.invalidateAllForEmail(email);

        // Generate OTP
        String code = OtpUtil.generateAlphanumeric(otpProperties.getLength());
        String salt = OtpUtil.randomBase64(16);
        String hash = OtpUtil.hmacSha256Base64(otpProperties.getHmacSecret(), code + "|" + salt + "|" + email);

        Instant now = Instant.now();
        EmailVerificationOtp evo = new EmailVerificationOtp();
        evo.setEmail(email);
        evo.setCodeHash(hash);
        evo.setSalt(salt);
        evo.setJti(UUID.randomUUID().toString());
        evo.setCreatedAt(now);
        evo.setExpiresAt(now.plusSeconds(otpProperties.getTtlSeconds()));
        evo.setMaxAttempts(otpProperties.getMaxAttempts());
        evo.setAttempts(0);
        evo.setUsed(false);
        evo.setIpHash(OtpUtil.hmacSha256Base64(otpProperties.getHmacSecret(), ip + "|" + salt));
        emailVerificationOtpRepository.save(evo);

        //emailService.sendEmailVerificationCode(email, code, Duration.ofSeconds(otpProperties.getTtlSeconds()));
    }

    @Transactional
    public void verifyCode(String rawEmail, String submittedCode, String ip) {
        String email = OtpUtil.normalizeEmail(rawEmail);
        Instant now = Instant.now();

        var activeOpt = emailVerificationOtpRepository.findTop1ByEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(email, now);
        if (activeOpt.isEmpty()) {
            throw new IllegalArgumentException("Verification failed");
        }
        var otp = activeOpt.get();

        if (otp.getAttempts() >= otp.getMaxAttempts()) {
            otp.setUsed(true); // lock this code
            emailVerificationOtpRepository.save(otp);
            throw new IllegalArgumentException("Verification failed");
        }

        otp.setAttempts(otp.getAttempts() + 1);
        String expected = OtpUtil.hmacSha256Base64(otpProperties.getHmacSecret(),
            submittedCode + "|" + otp.getSalt() + "|" + email);
        boolean ok = OtpUtil.constantTimeEquals(expected, otp.getCodeHash());
        emailVerificationOtpRepository.save(otp);
        if (!ok) {
            throw new IllegalArgumentException("Verification failed");
        }

        // Mark used atomically (race safety)
        if (emailVerificationOtpRepository.markUsedIfActive(otp.getId(), now) == 0) {
            throw new IllegalArgumentException("Verification failed");
        }

        // Flip in Keycloak and force fresh tokens
        String userId = keycloakUserService.ensureUser(email);
        keycloakUserService.markEmailVerified(userId);
        keycloakUserService.logout(userId);
    }
}
