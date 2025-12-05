package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.usermanagement.domain.User;
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
    public record IntervieweeUserDTO(UUID userId, String email, String firstName, String lastName, String avatar) {
        public static IntervieweeUserDTO fromUser(User user) {
            if (user == null) {
                return null;
            }
            return new IntervieweeUserDTO(user.getUserId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getAvatar());
        }
    }

    /**
     * Converts an {@link Interviewee} entity into its corresponding DTO.
     * Calculates the interview state based on lastInvited and slots.
     *
     * @param interviewee the entity to convert
     * @return the corresponding DTO
     */
    public static IntervieweeDTO fromEntity(Interviewee interviewee) {
        User user = interviewee.getApplication().getApplicant().getUser();
        InterviewSlot scheduledSlot = interviewee.getScheduledSlot();
        IntervieweeState state = calculateState(interviewee);

        return new IntervieweeDTO(
            interviewee.getId(),
            interviewee.getApplication().getApplicationId(),
            IntervieweeUserDTO.fromUser(user),
            interviewee.getLastInvited(),
            scheduledSlot != null ? InterviewSlotDTO.fromEntity(scheduledSlot) : null,
            state
        );
    }

    /**
     * Calculates the interview state based on the interviewee's data.
     * <p>
     * State logic:
     * - UNCONTACTED: lastInvited is null (no invitation sent)
     * - INVITED: lastInvited is set but no slot assigned
     * - SCHEDULED: has a slot assigned
     * - COMPLETED: slot exists and end time is in the past
     *
     * @param interviewee the interviewee to calculate state for
     * @return the calculated state
     */
    private static IntervieweeState calculateState(Interviewee interviewee) {
        InterviewSlot slot = interviewee.getScheduledSlot();

        // Has a scheduled slot
        if (slot != null) {
            // Check if interview is completed (end time in the past)
            if (slot.getEndDateTime().isBefore(Instant.now())) {
                return IntervieweeState.COMPLETED;
            }
            return IntervieweeState.SCHEDULED;
        }

        // No slot - check if invited
        if (interviewee.getLastInvited() != null) {
            return IntervieweeState.INVITED;
        }

        return IntervieweeState.UNCONTACTED;
    }
}
