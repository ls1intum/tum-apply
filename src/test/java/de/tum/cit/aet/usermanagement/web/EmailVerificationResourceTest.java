package de.tum.cit.aet.usermanagement.web;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp;
import de.tum.cit.aet.usermanagement.repository.EmailVerificationOtpRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Integration tests for the {@link de.tum.cit.aet.usermanagement.web.EmailVerificationResource} send-code
 * flow. The resend cooldown is asserted through the persisted OTP rows, since the code itself is only
 * delivered by email.
 */
public class EmailVerificationResourceTest extends AbstractResourceTest {

    private static final String SEND_CODE_PATH = "/api/auth/send-code";
    private static final String EMAIL = "applicant@example.org";
    private static final int ACCEPTED = 202;

    @Autowired
    MvcTestClient api;

    @Autowired
    EmailVerificationOtpRepository otpRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @BeforeEach
    void setUp() {
        databaseCleaner.clean();
        api.withoutPostProcessors();
    }

    private void sendCode(String email, boolean registration) {
        api.postAndRead(SEND_CODE_PATH, new EmailVerificationResource.SendCodeRequest(email, registration), Void.class, ACCEPTED);
    }

    @Test
    void persistsOtpWhenNoRecentCodeExists() {
        sendCode(EMAIL, true);

        assertThat(otpRepository.count()).isEqualTo(1);
    }

    @Test
    void doesNotPersistNewCodeWithinResendCooldown() {
        sendCode(EMAIL, true);
        sendCode(EMAIL, true);

        // The second request is inside the resend cooldown, so no additional OTP is stored.
        assertThat(otpRepository.count()).isEqualTo(1);
    }

    @Test
    void persistsNewCodeAfterCooldownElapses() {
        sendCode(EMAIL, true);
        EmailVerificationOtp otp = otpRepository.findAll().getFirst();
        otp.setCreatedAt(Instant.now().minusSeconds(120));
        otpRepository.saveAndFlush(otp);

        sendCode(EMAIL, true);

        assertThat(otpRepository.count()).isEqualTo(2);
    }

    @Test
    void doesNotPersistCodeForUnknownEmailOnLoginFlow() {
        sendCode("nobody@example.org", false);

        assertThat(otpRepository.count()).isZero();
    }
}
