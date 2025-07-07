package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.exception.MailingException;
import de.tum.cit.aet.core.notification.Email;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
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

    @Value("${aet.email.enabled:false}")
    private boolean emailEnabled;

    public EmailService(
        TemplateService templateService,
        ObjectProvider<JavaMailSender> mailSenderProvider,
        DocumentService documentService
    ) {
        this.templateService = templateService;
        this.mailSenderProvider = mailSenderProvider;
        this.documentService = documentService;
    }

    public void send(Email email) {
        String subject = templateService.renderSubject(email.getTemplate(), email.getLanguage(), email.getContent());
        String body;

        if (!StringUtils.isEmpty(email.getHtmlBody())) {
            body = templateService.renderRawTemplate(email.getLanguage(), email.getHtmlBody());
        } else {
            body = templateService.renderTemplate(email.getTemplate(), email.getLanguage(), email.getContent());
        }

        if (!emailEnabled) {
            log.info(">>>>Sending Simulated Email<<<<");
            log.info("To: {}", email.getTo());
            log.info("CC: {}", email.getCc());
            log.info("BCC: {}", email.getBcc());
            log.info("Subject: {}", subject);
            log.info("Body:\n{}", body);
            return;
        }

        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                throw new IllegalStateException("Mail sender not configured but email sending is enabled");
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email.getTo().toArray(new String[0]));

            if (email.getCc() != null && !email.getCc().isEmpty()) {
                helper.setCc(email.getCc().toArray(new String[0]));
            }

            if (email.getBcc() != null && !email.getBcc().isEmpty()) {
                helper.setBcc(email.getBcc().toArray(new String[0]));
            }

            helper.setSubject(subject);
            helper.setText(body, true); // HTML enabled

            if (email.getDocuments() != null) {
                int count = 1;
                for (Document doc : email.getDocuments()) {
                    Resource content = documentService.download(doc);
                    InputStreamSource attachment = new ByteArrayResource(content.getContentAsByteArray());
                    helper.addAttachment("document_" + count, attachment);
                }
            }

            mailSender.send(message);
        } catch (MessagingException | IOException e) {
            throw new MailingException(String.format("Failed to send email %s to %s", subject, email.getTo()));
        }
    }
}
