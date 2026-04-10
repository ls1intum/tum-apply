package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import java.util.UUID;

/** Reference to a member of a research group, with the role they hold there. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminMemberRefDTO(UUID userId, String firstName, String lastName, String email, UserRole role) {}
