package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO representing an interviewee in an interview process.
 * Contains applicant information, interview state, and scheduled slot details.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record IntervieweeDTO(
    UUID id,
    UUID applicationId,
    IntervieweeUserDTO user,
    Instant lastInvited,
    InterviewSlotDTO scheduledSlot,
    IntervieweeState state
) {
    /**
     * Enumeration of possible interviewee states.
     */
    public enum IntervieweeState {
        /** Applicant added to interview but not yet contacted */
        UNCONTACTED,
        /** Invitation email has been sent */
        INVITED,
        /** Interview slot has been scheduled */
        SCHEDULED,
        /** Interview has been completed */
        COMPLETED,
    }

    /**
     * Lightweight user DTO for interviewee display.
     */
    public record IntervieweeUserDTO(UUID userId, String email, String firstName, String lastName, String avatar) {}
}
