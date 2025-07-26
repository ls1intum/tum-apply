package de.tum.cit.aet.core.dto;

import de.tum.cit.aet.core.constants.EmailType;

public record EmailTemplateGroupDTO(String templateName, EmailType emailType, String firstName, String lastName, boolean isDefault) {}
