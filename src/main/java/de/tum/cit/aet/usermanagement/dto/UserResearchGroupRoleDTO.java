package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.UUID;

/**
 * A user's role within a specific research group, captured by id so it can be
 * re-imported. Mirrors the {@link UserResearchGroupRole} link entity.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserResearchGroupRoleDTO(UUID researchGroupId, UserRole role) {
    /**
     * @param role the link entity to convert; may be {@code null}
     * @return a flat DTO, or {@code null} if {@code role} is {@code null}
     */
    public static UserResearchGroupRoleDTO getFromEntity(UserResearchGroupRole role) {
        if (role == null) {
            return null;
        }
        return new UserResearchGroupRoleDTO(
            role.getResearchGroup() == null ? null : role.getResearchGroup().getResearchGroupId(),
            role.getRole()
        );
    }
}
