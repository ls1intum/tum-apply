package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.List;
import java.util.UUID;
import lombok.Data;

/**
 * A minimal representation of a user for lightweight API responses.
 */
@Data
public class UserShortDTO {

    private UUID userId;
    private String universityId;
    private String email;
    private String avatar;
    private String firstName;
    private String lastName;
    private List<UserRole> roles;

    /**
     * The "primary" research group, kept for backwards-compatibility with single-group
     * call sites. Set to the first PROFESSOR/EMPLOYEE membership when available.
     */
    private ResearchGroupShortDTO researchGroup;

    /**
     * All PROFESSOR/EMPLOYEE memberships of the user. Used by the client header
     * switcher to determine whether to render the active-group dropdown.
     */
    private List<ResearchGroupShortDTO> memberships;

    public UserShortDTO() {
        // default constructor
    }

    public UserShortDTO(User user) {
        this.userId = user.getUserId();
        this.universityId = user.getUniversityId();
        this.email = user.getEmail();
        this.avatar = user.getAvatar();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.roles = user.getResearchGroupRoles().stream().map(UserResearchGroupRole::getRole).toList();
        this.memberships = user
            .getResearchGroupRoles()
            .stream()
            .filter(r -> r.getRole() == UserRole.PROFESSOR || r.getRole() == UserRole.EMPLOYEE)
            .map(UserResearchGroupRole::getResearchGroup)
            .filter(rg -> rg != null)
            .distinct()
            .map(ResearchGroupShortDTO::new)
            .toList();
        this.researchGroup = this.memberships.isEmpty() ? null : this.memberships.get(0);
    }
}
