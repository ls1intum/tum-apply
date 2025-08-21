package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.notification.service.mail.Email;
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
    public void sendAsync(Email email) {
        emailService.send(email);
    }
}
