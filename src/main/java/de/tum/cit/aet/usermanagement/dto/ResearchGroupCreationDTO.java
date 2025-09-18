package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ResearchGroupCreationDTO(
    @NotBlank @Size(min = 3, max = 150) String name,
    @NotBlank @Size(min = 3, max = 150) String headName,
    @NotBlank @Size(min = 3, max = 150) String universityId
) {}
