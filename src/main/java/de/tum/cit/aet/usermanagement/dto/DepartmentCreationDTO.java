package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * DTO for creating a new Department.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record DepartmentCreationDTO(
    @NotBlank @Size(min = 2, max = 200) String name,
    @NotNull UUID schoolId
) {}
