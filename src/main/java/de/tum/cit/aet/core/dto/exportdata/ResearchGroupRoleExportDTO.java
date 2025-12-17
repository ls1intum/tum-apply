package de.tum.cit.aet.core.dto.exportdata;

import de.tum.cit.aet.usermanagement.constants.UserRole;

public record ResearchGroupRoleExportDTO(String researchGroupName, UserRole role) {}
