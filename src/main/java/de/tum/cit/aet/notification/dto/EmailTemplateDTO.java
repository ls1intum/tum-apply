package de.tum.cit.aet.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.notification.constants.EmailType;
import java.util.UUID;

/**
 * DTO used to read, update, or create a single template.
 * Defaults have a {@code null} id; customs have a populated id.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record EmailTemplateDTO(
    UUID emailTemplateId,
    EmailType emailType,
    EmailTemplateTranslationDTO english,
    EmailTemplateTranslationDTO german
) {}
