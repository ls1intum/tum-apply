package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.UUID;

/**
 * Projection record for aggregated interviewee state counts per interview process.
 * Used by the JPQL aggregate query that counts interviewees by their derived state.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record IntervieweeStateCounts(UUID processId, long completedCount, long scheduledCount, long invitedCount, long uncontactedCount) {}
