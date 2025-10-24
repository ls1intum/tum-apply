package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record InterviewOverviewDTO(
    @NotNull UUID jobId,
    @NotNull String jobTitle,
    @NotNull Integer completedCount,
    @NotNull Integer scheduledCount,
    @NotNull Integer invitedCount,
    @NotNull Integer uncontactedCount,
    @NotNull Integer totalInterviews
)
{}
