package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.MailingException;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.notification.domain.EmailTemplateTranslation;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamSource;
import org.springframework.core.io.Resource;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final TemplateProcessingService templateProcessingService;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final EmailSettingService emailSettingService;
    private final EmailTemplateService emailTemplateService;

    @Value("${aet.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${aet.email.from:test}")
    private String from;

    public EmailService(
        TemplateProcessingService templateProcessingService,
        ObjectProvider<JavaMailSender> mailSenderProvider,
        DocumentService documentService,
        DocumentRepository documentRepository,
        EmailSettingService emailSettingService,
        EmailTemplateService emailTemplateService
    ) {
        this.templateProcessingService = templateProcessingService;
        this.mailSenderProvider = mailSenderProvider;
        this.documentService = documentService;
        this.documentRepository = documentRepository;
        this.emailSettingService = emailSettingService;
        this.emailTemplateService = emailTemplateService;
    }

    /**
     * Sends an email and includes retry logic for transient mailing errors.
     * If email sending is disabled, it will log the email contents instead.
     *
     * @param email the email to be sent
     */
    @Retryable(retryFor = MailingException.class, maxAttempts = 3, backoff = @Backoff(delay = 5000, multiplier = 2))
    protected void send(Email email) {
        email.validate();

        EmailTemplateTranslation tpl = getEmailTemplateTranslation(email);
        String subject = renderSubject(email, tpl);
        String body = renderBody(email, tpl);

        if (!emailEnabled) {
            simulateEmail(email, subject, body);
            return;
        }

        sendEmail(email, subject, body); // throws MailingException on failure
    }

    /**
     * Recovery method called when all retry attempts for sending an email fail.
     *
     * @param ex    the cause of the failure
     * @param email the email that failed to send
     */
    @Recover
    protected void recoverMailingException(MailingException ex, Email email) {
        log.error("Email sending failed permanently after retries. To: {}", email.getRecipients());
    }

    /**
     * Renders the email subject using the template processor.
     * If a custom subject is set it will be rendered as-is
     * Otherwise, the subject of the template will be used
     *
     * @param email                    the email
     * @param emailTemplateTranslation the template translation
     * @return the rendered subject
     */
    private String renderSubject(Email email, EmailTemplateTranslation emailTemplateTranslation) {
        if (StringUtils.isNotEmpty(email.getCustomSubject()) || emailTemplateTranslation == null) {
            return templateProcessingService.renderSubject(email.getCustomSubject());
        }
        return templateProcessingService.renderSubject(emailTemplateTranslation);
    }

    /**
     * Renders the email body.
     * If an HTML body is already present in the email, it will be rendered as-is
     * Otherwise, the body is rendered using the template.
     *
     * @param email                    the email to render
     * @param emailTemplateTranslation the template translation
     * @return the rendered HTML body
     */
    private String renderBody(Email email, EmailTemplateTranslation emailTemplateTranslation) {
        if (StringUtils.isNotEmpty(email.getCustomBody()) || emailTemplateTranslation == null) {
            return templateProcessingService.renderRawTemplate(email.getLanguage(), email.getCustomBody());
        }
        return templateProcessingService.renderTemplate(emailTemplateTranslation, email.getContent());
    }

    /**
     * Logs the email instead of sending it. Used for local testing or when sending is disabled.
     *
     * @param email   the email
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
            getRecipientsToNotify(email.getTo(), email),
            getRecipientsToNotify(email.getCc(), email),
            getRecipientsToNotify(email.getBcc(), email),
            subject,
            Jsoup.parse(body)
        );
    }

    /**
     * Sends a fully constructed email using JavaMailSender.
     * Includes optional CC, BCC, and file attachments.
     *
     * @param email   the email
     * @param subject the rendered subject
     * @param body    the rendered HTML body
     * @throws MailingException if sending fails
     */
    private void sendEmail(Email email, String subject, String body) {
        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                throw new IllegalStateException("Mail sender not configured but email sending is enabled");
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            Set<String> to = getRecipientsToNotify(email.getTo(), email);
            if (to.isEmpty()) {
                return;
            }

            helper.setTo(to.toArray(new String[0]));
            helper.setCc(getRecipientsToNotify(email.getCc(), email).toArray(new String[0]));
            helper.setBcc(getRecipientsToNotify(email.getBcc(), email).toArray(new String[0]));

            helper.setFrom(from);
            helper.setSubject(subject);
            helper.setText(body, true);

            attachDocuments(email, helper);

            mailSender.send(message);
        } catch (MailException | IOException | MessagingException e) {
            log.error("Failed to send email to: {}. Reason: {}", email.getTo(), e.getMessage());
            throw new MailingException(e.getMessage());
        }
    }

    /**
     * Loads the appropriate template translation based on email metadata.
     *
     * @param email the email
     * @return the corresponding {@link EmailTemplateTranslation}
     */
    private EmailTemplateTranslation getEmailTemplateTranslation(Email email) {
        if (email.getEmailType() == null || email.getResearchGroup() == null) {
            return null;
        }
        return emailTemplateService.getTemplateTranslation(
            email.getResearchGroup(),
            email.getTemplateName(),
            email.getEmailType(),
            email.getLanguage()
        );
    }

    /**
     * Filters a list of users to those who have notification enabled for a given email type.
     *
     * @param users the users to filter
     * @param email the email context
     * @return a set of email addresses to notify
     */
    private Set<String> getRecipientsToNotify(Set<User> users, Email email) {
        if (email.isSendAlways()) {
            return users.stream().map(User::getEmail).collect(Collectors.toSet());
        }
        return users
            .stream()
            .filter(user -> emailSettingService.canNotify(email.getEmailType(), user))
            .map(User::getEmail)
            .collect(Collectors.toSet());
    }

    /**
     * Attaches documents to the outgoing email message.
     *
     * @param email  the email containing document references
     * @param helper the message helper
     * @throws IOException        if reading document content fails
     * @throws MessagingException if attaching documents fails
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
