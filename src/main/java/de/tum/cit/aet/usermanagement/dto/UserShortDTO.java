package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;
import lombok.Data;

/**
 * A minimal representation of a user for lightweight API responses.
 */
@Data
public class UserShortDTO {

    private UUID userId;
    private String firstName;
    private String lastName;
    private String email;

    public UserShortDTO() {
        // default constructor
    }

    public UserShortDTO(User user) {
        this.userId = user.getUserId();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.email = user.getEmail();
    }
}
