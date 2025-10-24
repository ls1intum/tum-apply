package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record InterviewOverviewDTO(
    @NotNull UUID jobId,
    @NotNull String jobTitle,
    @NotNull Long completedCount,
    @NotNull Long scheduledCount,
    @NotNull Long invitedCount,
    @NotNull Long uncontactedCount,
    @NotNull Long totalInterviews
)
{}
