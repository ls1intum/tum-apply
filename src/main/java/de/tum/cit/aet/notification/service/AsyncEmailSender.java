package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.notification.service.mail.Email;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;


/**
 * Service for sending emails asynchronously using {@link EmailService}.
 */
@Service
@AllArgsConstructor
@Slf4j
public class AsyncEmailSender {

    private final EmailService emailService;

    /**
     * Sends the given email asynchronously.
     * @param email the email to send
     */
    @Async
    public void sendAsync(Email email) {
        emailService.send(email);
    }
}
