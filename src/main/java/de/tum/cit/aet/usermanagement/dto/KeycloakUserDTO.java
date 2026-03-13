package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;
import org.keycloak.representations.idm.UserRepresentation;

/**
 * DTO representing a Keycloak user.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record KeycloakUserDTO(UUID id, String username, String firstName, String lastName, String email, String universityId) {
    /**
     * Creates a {@link KeycloakUserDTO} from a Keycloak {@link UserRepresentation},
     * extracting the LDAP_ID attribute as the universityId.
     */
    public static KeycloakUserDTO fromLdapUser(UserRepresentation user) {
        return new KeycloakUserDTO(
            UUID.fromString(user.getId()),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getAttributes().get("LDAP_ID").getFirst()
        );
    }

    /**
     * Creates a {@link KeycloakUserDTO} from a local {@link User} entity.
     * The universityId may be null for non-TUM users.
     */
    public static KeycloakUserDTO fromUser(User user) {
        return new KeycloakUserDTO(
            user.getUserId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getUniversityId()
        );
    }
}
