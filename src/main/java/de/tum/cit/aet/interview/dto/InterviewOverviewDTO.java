package de.tum.cit.aet.interview.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * DTO used to provide summary information about interview processes
 * for a given job, including counts by interview state for overview displays on
 * the client side.
 */
public record InterviewOverviewDTO(
    @NotNull UUID jobId,
    @NotNull UUID processId,
    @NotNull String jobTitle,
    String imageUrl,
    @NotNull Long completedCount,
    @NotNull Long scheduledCount,
    @NotNull Long invitedCount,
    @NotNull Long uncontactedCount,
    @NotNull Long totalSlots,
    @NotNull Long totalInterviews,
    boolean isClosed
) {}
