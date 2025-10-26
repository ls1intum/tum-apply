package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * DTO for creating a new interview process.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record CreateInterviewProcessDTO(
    @NotNull(message = "Job ID must not be null")
    UUID jobId
) {}
