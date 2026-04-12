package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.UUID;

/**
 * Reference to a member of a research group, with the role they hold there.
 * Lightweight by design — only the fields needed to identify a member and
 * their role are present, so the same DTO can serve overview lists and
 * re-importable exports.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResearchGroupMemberDTO(UUID userId, String firstName, String lastName, String email, UserRole role) {
    /**
     * @param role the role link entity; may be {@code null}
     * @return a flat DTO, or {@code null} if {@code role} or its user is {@code null}
     */
    public static ResearchGroupMemberDTO getFromEntity(UserResearchGroupRole role) {
        if (role == null || role.getUser() == null) {
            return null;
        }
        return new ResearchGroupMemberDTO(
            role.getUser().getUserId(),
            role.getUser().getFirstName(),
            role.getUser().getLastName(),
            role.getUser().getEmail(),
            role.getRole()
        );
    }
}
