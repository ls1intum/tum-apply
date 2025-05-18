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
    private String email;
    private String firstName;
    private String lastName;
    private List<UserRole> roles;
    private ResearchGroupShortDTO researchGroup;

    public UserShortDTO() {
        // default constructor
    }

    public UserShortDTO(User user) {
        this.userId = user.getUserId();
        this.email = user.getEmail();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.roles = user.getResearchGroupRoles().stream().map(UserResearchGroupRole::getRole).toList();
        this.researchGroup = user.getResearchGroup() != null ? new ResearchGroupShortDTO(user.getResearchGroup()) : null;
    }
}
