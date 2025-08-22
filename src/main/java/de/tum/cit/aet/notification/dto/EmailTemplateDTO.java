package de.tum.cit.aet.notification.dto;

import de.tum.cit.aet.notification.constants.EmailType;
import java.util.UUID;

/**
 * DTO used to read, update, create a single template
 */
public record EmailTemplateDTO(
    UUID emailTemplateId,
    String templateName,
    EmailType emailType,
    boolean isDefault,
    EmailTemplateTranslationDTO english,
    EmailTemplateTranslationDTO german
) {}
