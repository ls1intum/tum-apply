package de.tum.cit.aet.core.dto;

import de.tum.cit.aet.core.constants.EmailType;
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
