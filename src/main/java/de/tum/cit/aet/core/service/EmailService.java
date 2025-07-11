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
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.core.io.Resource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
     * Sends an email using the provided configuration.
     *
     * @param email the email object containing recipients, template, content, etc.
     */
    public void send(Email email) {
        email.validate();

        String subject = renderSubject(email);
        String body = renderBody(email);

        if (!emailEnabled) {
            simulateEmail(email, subject, body);
            return;
        }

        sendEmail(email, subject, body);
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
            body
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
            throw new MailingException(String.format("Failed to send email %s to %s", subject, email.getTo()));
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
        if (email.getDocumentIds() == null) return;

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
