package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AddMembersToResearchGroupDTO(@NotEmpty List<KeycloakUserDTO> keycloakUsers, UUID researchGroupId) {}
