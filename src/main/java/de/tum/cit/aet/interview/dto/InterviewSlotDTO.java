package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO representing an interview slot.
 * Used to transfer slot information between server and client without
 * exposing the full {@link InterviewSlot} entity.
 * Contains details such as time range, location, stream link, booking state,
 * and optionally the assigned interviewee.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record InterviewSlotDTO(
    UUID id,
    UUID interviewProcessId,
    Instant startDateTime,
    Instant endDateTime,
    String location,
    String streamLink,
    Boolean isBooked,
    AssignedIntervieweeDTO interviewee
) {
    /**
     * Converts an {@link InterviewSlot} entity into its corresponding
     * {@link InterviewSlotDTO}.
     * Used to transfer interview slot data to the cleint without exposing the
     * full entity.
     * Does not include interviewee information.
     *
     * @param slot the {@link InterviewSlot} entity to convert
     * @return the corresponding {@link InterviewSlotDTO} containing the slot's
     *         public data
     */
    public static InterviewSlotDTO fromEntity(InterviewSlot slot) {
        return fromEntity(slot, null);
    }

    /**
     * Converts an {@link InterviewSlot} entity into its corresponding
     * {@link InterviewSlotDTO}
     * with optional interviewee information.
     *
     * @param slot        the {@link InterviewSlot} entity to convert
     * @param interviewee the assigned interviewee DTO, or null if not assigned
     * @return the corresponding {@link InterviewSlotDTO} containing the slot's
     *         public data
     */
    public static InterviewSlotDTO fromEntity(InterviewSlot slot, AssignedIntervieweeDTO interviewee) {
        return new InterviewSlotDTO(
            slot.getId(),
            slot.getInterviewProcess().getId(),
            slot.getStartDateTime(),
            slot.getEndDateTime(),
            slot.getLocation(),
            slot.getStreamLink(),
            slot.getIsBooked(),
            interviewee
        );
    }
}
