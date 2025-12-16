package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

/**
 * DTO for adding applicants to an interview process.
 * Contains a list of application IDs to be added as interviewees.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AddIntervieweesDTO(
        @NotNull(message = "Application IDs cannot be null") List<UUID> applicationIds) {
}
