package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import java.util.UUID;

/** A user's role within a specific research group. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminUserRoleDTO(UUID researchGroupId, UserRole role) {}
