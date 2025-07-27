package de.tum.cit.aet.core.dto;

import de.tum.cit.aet.core.constants.EmailType;

import java.util.UUID;

public record EmailTemplateGroupDTO(UUID emailTemplateId, String templateName, EmailType emailType, String firstName, String lastName, boolean isDefault) {}
