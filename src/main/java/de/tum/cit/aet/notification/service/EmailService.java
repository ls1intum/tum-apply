package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.MailingException;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.notification.service.EmailTemplateService.EmailContent;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
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

    @Value("${aet.email.from-name:test}")
    private String fromName;

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

        EmailContent content = null;
        if (StringUtils.isEmpty(email.getCustomSubject()) && StringUtils.isEmpty(email.getCustomBody())) {
            content = resolveContent(email);
        }
        String subject = renderSubject(email, content);
        String body = renderBody(email, content);

        if (!emailEnabled) {
            simulateEmail(email, subject, body);
            return;
        }

        sendEmail(email, subject, body); // throws MailingException on failure
    }

    /**
     * Recovery method called when all retry attempts for sending an email fail.
     */
    @Recover
    protected void recoverMailingException(MailingException ex, Email email) {
        log.error("Email sending failed permanently after retries. To: {}", email.getRecipients());
    }

    private String renderSubject(Email email, EmailContent content) {
        if (StringUtils.isNotEmpty(email.getCustomSubject()) || content == null) {
            return templateProcessingService.renderSubject(email.getCustomSubject(), email.getContent());
        }
        return templateProcessingService.renderSubject(content.subject(), email.getContent());
    }

    private String renderBody(Email email, EmailContent content) {
        if (StringUtils.isNotEmpty(email.getCustomBody()) || content == null) {
            return templateProcessingService.renderRawTemplate(email.getLanguage(), email.getCustomBody());
        }
        return templateProcessingService.renderTemplate(email.getLanguage(), content.bodyHtml(), email.getContent());
    }

    private void simulateEmail(Email email, String subject, String body) {
        org.jsoup.nodes.Document parsedBody = Jsoup.parse(body);
        log.info(
            """
            >>>> Sending Simulated Email <<<<
              To: {}
              CC: {}
              BCC: {}
              Subject: {}
              Anchor Hrefs: {}
              Body HTML: {}
            """,
            getRecipientsToNotify(email.getTo(), email),
            getRecipientsToNotify(email.getCc(), email),
            getRecipientsToNotify(email.getBcc(), email),
            subject,
            parsedBody.select("a[href]").eachAttr("href"),
            body
        );
    }

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

            helper.setFrom(from, fromName);
            helper.setSubject(subject);
            helper.setText(body, true);

            attachDocuments(email, helper);
            attachIcsCalendar(email, helper);

            mailSender.send(message);
        } catch (MailException | IOException | MessagingException e) {
            log.error("Failed to send email to: {}. Reason: {}", email.getTo(), e.getMessage());
            throw new MailingException(e.getMessage());
        }
    }

    /**
     * Loads custom or default content for an email based on its type, research group, and language.
     */
    private EmailContent resolveContent(Email email) {
        if (email.getEmailType() == null) {
            log.warn("Cannot resolve email content: EmailType is null for email to recipients {}", email.getRecipients());
            return null;
        }
        return emailTemplateService.resolveContent(email.getResearchGroup(), email.getEmailType(), email.getLanguage());
    }

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

    private void attachIcsCalendar(Email email, MimeMessageHelper helper) {
        if (email.getIcsContent() == null || email.getIcsFileName() == null) {
            return;
        }

        try {
            byte[] icsBytes = email.getIcsContent().getBytes(StandardCharsets.UTF_8);
            InputStreamSource icsSource = new ByteArrayResource(icsBytes);
            helper.addAttachment(email.getIcsFileName(), icsSource, "text/calendar");
        } catch (MessagingException e) {
            log.warn("Failed to attach ICS calendar file '{}' to email: {}", email.getIcsFileName(), e.getMessage());
        }
    }
}
