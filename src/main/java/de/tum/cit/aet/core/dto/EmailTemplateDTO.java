package de.tum.cit.aet.core.dto;

import de.tum.cit.aet.core.constants.EmailType;
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
