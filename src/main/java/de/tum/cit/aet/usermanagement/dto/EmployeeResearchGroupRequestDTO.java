package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for employee research group access requests during onboarding.
 * Contains the professor name that the employee is working for.
 * This is a temporary solution until the employee role is added.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record EmployeeResearchGroupRequestDTO(@NotBlank(message = "Professor name is required") String professorName) {}
