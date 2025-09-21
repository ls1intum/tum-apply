package de.tum.cit.aet.usermanagement.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record ResearchGroupProvisionDTO(
    @NotBlank String universityId,
    UUID researchGroupId
) {}

