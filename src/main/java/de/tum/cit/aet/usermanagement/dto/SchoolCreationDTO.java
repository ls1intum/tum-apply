package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for creating a new School.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record SchoolCreationDTO(@NotBlank @Size(min = 2, max = 200) String name, @NotBlank @Size(min = 2, max = 20) String abbreviation) {}
