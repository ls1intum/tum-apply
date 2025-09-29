package de.tum.cit.aet.usermanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ResearchGroupProvisionDTO(
    @NotBlank @Size(min = 3, max = 7) String universityId,
    UUID researchGroupId
) {}

