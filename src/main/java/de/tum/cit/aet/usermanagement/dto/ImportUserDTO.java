package de.tum.cit.aet.usermanagement.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Request body for importing an existing Keycloak user by UUID.
 *
 * @param keycloakUserId the Keycloak user id to import
 */
public record ImportUserDTO(@NotNull UUID keycloakUserId) {}
