package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.MailingException;
import de.tum.cit.aet.core.notification.Email;
import de.tum.cit.aet.core.repository.DocumentRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.core.io.Resource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final TemplateService templateService;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final DocumentService documentService;
    private final DocumentRepository documentRepository;

    @Value("${aet.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${aet.email.from:test}")
    private String from;

    public EmailService(
        TemplateService templateService,
        ObjectProvider<JavaMailSender> mailSenderProvider,
        DocumentService documentService,
        DocumentRepository documentRepository
    ) {
        this.templateService = templateService;
        this.mailSenderProvider = mailSenderProvider;
        this.documentService = documentService;
        this.documentRepository = documentRepository;
    }

    /**
     * Sends an email asynchronously with retry logic for transient mailing errors.
     *
     * @param email the email to be sent
     */
    @Async
    @Retryable(retryFor = { MailingException.class }, maxAttempts = 3, backoff = @Backoff(delay = 5000, multiplier = 2))
    public CompletableFuture<Void> send(Email email) {
        try {
            email.validate();
        } catch (IllegalArgumentException e) {
            log.error("Email validation failed", e);
            return CompletableFuture.completedFuture(null);
        }

        String subject = renderSubject(email);
        String body = renderBody(email);

        if (!emailEnabled) {
            simulateEmail(email, subject, body);
            return CompletableFuture.completedFuture(null);
        }

        sendEmail(email, subject, body);
        log.info("Email successfully sent to: {}", email.getTo());
        return CompletableFuture.completedFuture(null);
    }

    /**
     * Recovery method called when all retry attempts for sending an email fail.
     *
     * @param ex    the exception that caused the failure
     * @param email the email that failed to send
     */
    @Recover
    public CompletableFuture<Void> recoverMailingException(MailingException ex, Email email) {
        log.error("Email sending failed permanently after multiple retries. To: {}. Reason: {}", email.getTo(), ex.getMessage());
        return CompletableFuture.completedFuture(null);
    }

    /**
     * Renders the subject of the email using a localized template.
     *
     * @param email the email to process
     * @return rendered subject line
     */
    private String renderSubject(Email email) {
        return templateService.renderSubject(email.getTemplate(), email.getLanguage(), email.getContent());
    }

    /**
     * Renders the HTML body of the email based on raw content or template.
     *
     * @param email the email to process
     * @return rendered HTML body
     */
    private String renderBody(Email email) {
        if (StringUtils.isNotEmpty(email.getHtmlBody())) {
            return templateService.renderRawTemplate(email.getLanguage(), email.getHtmlBody());
        }
        return templateService.renderTemplate(email.getTemplate(), email.getLanguage(), email.getContent());
    }

    /**
     * Logs the email contents instead of sending them.
     * Used when email sending is disabled in configuration.
     *
     * @param email   the email object
     * @param subject the rendered subject
     * @param body    the rendered HTML body
     */
    private void simulateEmail(Email email, String subject, String body) {
        log.info(
            """
            >>>> Sending Simulated Email <<<<
              To: {}
              CC: {}
              BCC: {}
              Subject: {}
              Parsed Body: {}
            """,
            email.getTo(),
            email.getCc(),
            email.getBcc(),
            subject,
            Jsoup.parse(body)
        );
    }

    /**
     * Sends the email using JavaMailSender with optional attachments.
     *
     * @param email   the email object
     * @param subject the rendered subject
     * @param body    the rendered HTML body
     */
    private void sendEmail(Email email, String subject, String body) {
        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                log.error("Mail sender not configured but email sending is enabled. Could not sent email to {}", email.getTo());
                throw new IllegalStateException("Mail sender not configured but email sending is enabled");
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(from);
            helper.setTo(email.getTo().toArray(new String[0]));

            if (!email.getCc().isEmpty()) {
                helper.setCc(email.getCc().toArray(new String[0]));
            }
            if (!email.getBcc().isEmpty()) {
                helper.setBcc(email.getBcc().toArray(new String[0]));
            }

            helper.setSubject(subject);
            helper.setText(body, true);

            attachDocuments(email, helper);
            mailSender.send(message);
        } catch (MessagingException | IOException e) {
            log.error("Failed to send email to: {}. Reason: {}", email.getTo(), e.getMessage());
            throw new MailingException(e.getMessage());
        }
    }

    /**
     * Attaches documents to the email.
     *
     * @param email  the email containing document references
     * @param helper the message helper used for attachment
     * @throws IOException        if document content cannot be read
     * @throws MessagingException if attachment fails
     */
    private void attachDocuments(Email email, MimeMessageHelper helper) throws IOException, MessagingException {
        if (email.getDocumentIds() == null) {
            return;
        }

        int count = 1;
        for (UUID documentId : email.getDocumentIds()) {
            Document document = documentRepository
                .findById(documentId)
                .orElseThrow(() -> EntityNotFoundException.forId("document", documentId));
            Resource content = documentService.download(document);
            InputStreamSource attachment = new ByteArrayResource(content.getContentAsByteArray());
            helper.addAttachment("document_" + count, attachment);
            count++;
        }
    }
}
