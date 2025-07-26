package de.tum.cit.aet.core.dto;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.EmailTemplate;
import java.util.UUID;

public record EmailTemplateDTO(
    UUID emailTemplateId,
    String templateName,
    Language language,
    EmailType emailType,
    String subject,
    String htmlBody,
    boolean isDefault
) {
    public static EmailTemplateDTO from(EmailTemplate emailTemplate) {
        return new EmailTemplateDTO(
            emailTemplate.getEmailTemplateId(),
            emailTemplate.getTemplateName(),
            emailTemplate.getLanguage(),
            emailTemplate.getEmailType(),
            emailTemplate.getSubject(),
            emailTemplate.getBodyHtml(),
            emailTemplate.isDefault()
        );
    }
}
