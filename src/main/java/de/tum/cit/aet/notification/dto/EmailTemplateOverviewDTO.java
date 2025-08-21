package de.tum.cit.aet.notification.dto;

import de.tum.cit.aet.notification.constants.EmailType;
import java.util.UUID;

/**
 * DTO used for the overview (list view) of all templates
 */
public record EmailTemplateOverviewDTO(
    UUID emailTemplateId,
    String templateName,
    EmailType emailType,
    String firstName,
    String lastName,
    boolean isDefault
) {}
