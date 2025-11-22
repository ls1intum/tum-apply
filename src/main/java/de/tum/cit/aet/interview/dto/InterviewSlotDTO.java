package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO representing an interview slot.
 * Used to transfer slot information between backend and frontend without exposing the full {@link InterviewSlot} entity.
 * Contains details such as time range, location, stream link, and booking state.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record InterviewSlotDTO(
    UUID id,
    UUID interviewProcessId,
    Instant startDateTime,
    Instant endDateTime,
    String location,
    String streamLink,
    Boolean isBooked
) {
    /**
     * Converts an {@link InterviewSlot} entity into its corresponding {@link InterviewSlotDTO}.
     * Used to transfer interview slot data to the frontend without exposing the full entity.
     *
     * @param slot the {@link InterviewSlot} entity to convert
     * @return the corresponding {@link InterviewSlotDTO} containing the slot's public data
     */
    public static InterviewSlotDTO fromEntity(InterviewSlot slot) {
        return new InterviewSlotDTO(
            slot.getId(),
            slot.getInterviewProcess().getId(),
            slot.getStartDateTime(),
            slot.getEndDateTime(),
            slot.getLocation(),
            slot.getStreamLink(),
            slot.getIsBooked()
        );
    }
}
