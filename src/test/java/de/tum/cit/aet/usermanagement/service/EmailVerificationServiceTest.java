package de.tum.cit.aet.usermanagement.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.EmailVerificationOtp;
import de.tum.cit.aet.usermanagement.repository.EmailVerificationOtpRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private EmailVerificationOtpRepository otpRepository;

    @Mock
    private AsyncEmailSender asyncEmailSender;

    @Mock
    private UserRepository userRepository;

    private EmailVerificationService service;

    @BeforeEach
    void setUp() {
        service = new EmailVerificationService(otpRepository, asyncEmailSender, userRepository);
        ReflectionTestUtils.setField(service, "otpLength", 6);
        ReflectionTestUtils.setField(service, "otpTtlSeconds", 900L);
        ReflectionTestUtils.setField(service, "otpMaxAttempts", 6);
        ReflectionTestUtils.setField(service, "otpResendCooldownSeconds", 60L);
        ReflectionTestUtils.setField(service, "otpHmacSecret", "3vWK1lE1FnrjAovOmWwn8O9xqq5WTtNOY/NUdSAKmoQ=");
    }

    @Test
    void doesNotSendNewCodeWhenWithinResendCooldown() {
        EmailVerificationOtp recent = new EmailVerificationOtp();
        recent.setEmail("applicant@example.org");
        recent.setCreatedAt(Instant.now().minusSeconds(10)); // within the 60s cooldown
        when(otpRepository.findTop1ByEmailOrderByCreatedAtDesc("applicant@example.org")).thenReturn(Optional.of(recent));

        service.sendCode("applicant@example.org", "127.0.0.1", true);

        verify(otpRepository, never()).invalidateAllForEmail(anyString());
        verify(otpRepository, never()).save(any());
        verify(asyncEmailSender, never()).sendAsync(any(Email.class));
    }

    @Test
    void sendsCodeWhenNoRecentCodeExists() {
        when(otpRepository.findTop1ByEmailOrderByCreatedAtDesc("applicant@example.org")).thenReturn(Optional.empty());

        service.sendCode("applicant@example.org", "127.0.0.1", true);

        verify(otpRepository).invalidateAllForEmail("applicant@example.org");
        verify(otpRepository).save(any(EmailVerificationOtp.class));
        verify(asyncEmailSender).sendAsync(any(Email.class));
    }

    @Test
    void sendsCodeAfterCooldownElapsed() {
        EmailVerificationOtp old = new EmailVerificationOtp();
        old.setEmail("applicant@example.org");
        old.setCreatedAt(Instant.now().minusSeconds(120)); // older than the 60s cooldown
        when(otpRepository.findTop1ByEmailOrderByCreatedAtDesc("applicant@example.org")).thenReturn(Optional.of(old));

        service.sendCode("applicant@example.org", "127.0.0.1", true);

        verify(otpRepository).save(any(EmailVerificationOtp.class));
        verify(asyncEmailSender).sendAsync(any(Email.class));
    }
}
