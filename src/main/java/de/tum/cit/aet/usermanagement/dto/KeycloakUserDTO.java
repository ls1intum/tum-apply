package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

/**
 * DTO representing a Keycloak user.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record KeycloakUserDTO(UUID id, String username, String firstName, String lastName, String email, String universityId) {}
