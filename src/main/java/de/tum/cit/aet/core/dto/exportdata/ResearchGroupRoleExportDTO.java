package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.constants.UserRole;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResearchGroupRoleExportDTO(String researchGroupName, UserRole role) {}
