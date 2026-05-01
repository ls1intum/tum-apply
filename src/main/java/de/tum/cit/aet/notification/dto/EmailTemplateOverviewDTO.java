package de.tum.cit.aet.notification.dto;

import de.tum.cit.aet.notification.constants.EmailType;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO used for the unified list of templates. One entry per email type,
 * representing either a custom template (DB row) or a system default (resource file).
 *
 * @param emailTemplateId  populated for customs, {@code null} for defaults
 * @param emailType        the email type this row represents
 * @param isCustom         {@code true} if a custom row exists for this email type
 * @param english          english subject + body content
 * @param german           german subject + body content
 * @param firstName        creator first name (customs only)
 * @param lastName         creator last name (customs only)
 * @param lastModifiedAt   last modification timestamp (customs only)
 */
public record EmailTemplateOverviewDTO(
    UUID emailTemplateId,
    EmailType emailType,
    boolean isCustom,
    EmailTemplateTranslationDTO english,
    EmailTemplateTranslationDTO german,
    String firstName,
    String lastName,
    Instant lastModifiedAt
) {}
