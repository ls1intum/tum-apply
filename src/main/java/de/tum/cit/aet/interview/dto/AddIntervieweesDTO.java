package de.tum.cit.aet.interview.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

/**
 * DTO for adding applicants to an interview process.
 * Contains a list of application IDs to be added as interviewees.
 */
public record AddIntervieweesDTO(
    @NotNull(message = "Application IDs cannot be null") @NotEmpty(message = "Application IDs cannot be empty") List<UUID> applicationIds
) {}
