package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.dto.UserDTO;
import de.tum.cit.aet.usermanagement.dto.UserResearchGroupRoleDTO;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Re-importable representation of a {@link de.tum.cit.aet.usermanagement.domain.User}
 * for admin bulk exports. Wraps the existing {@link UserDTO} (which covers
 * personal details plus the primary research group via its short DTO) and
 * only adds the fields the admin export needs on top: university id,
 * last-activity timestamp, AI feature flags, per-rg roles, and audit
 * timestamps.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminUserExportDTO(
    UserDTO user,
    String universityId,
    LocalDateTime lastActivityAt,
    boolean aiFeaturesEnabled,
    LocalDateTime aiConsentedAt,
    List<UserResearchGroupRoleDTO> roles,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {}
