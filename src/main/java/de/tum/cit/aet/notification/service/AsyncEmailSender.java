package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.notification.service.mail.Email;
import java.util.concurrent.CompletableFuture;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Slf4j
public class AsyncEmailSender {

    private final EmailService emailService;

    @Async
    public CompletableFuture<Void> sendAsync(Email email) {
        return CompletableFuture.runAsync(() -> emailService.send(email)).whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to sent email to: {} {}", email.getRecipients(), ex.getMessage(), ex);
                } else {
                    log.info("Email successfully sent to: {}", email.getRecipients());
                }
            });
    }
}
