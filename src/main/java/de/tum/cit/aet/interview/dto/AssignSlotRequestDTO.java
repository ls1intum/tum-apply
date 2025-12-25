package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Request DTO for assigning an interviewee to an interview slot.
 * Contains the application ID of the applicant to be assigned.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AssignSlotRequestDTO(
        @NotNull(message = "Application ID is required") UUID applicationId) {
}
