package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO containing conflict data for slot creation validation.
 * Returns all slots relevant for conflict detection on a specific date in a single response.
 * The  client side uses currentProcessId to distinguish between:
 * - SAME_PROCESS conflicts (slot belongs to current process)
 * - BOOKED_OTHER_PROCESS conflicts (booked slot from another process)
 *
 * @param currentProcessId the current interview process ID for client-side
 *                         filtering
 * @param slots            combined list of all process slots + booked slots
 *                         from other processes
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ConflictDataDTO(UUID currentProcessId, List<ExistingSlotDTO> slots) {
    /**
     * Simplified slot DTO for conflict checking.
     * Contains only the fields needed to detect and display conflicts.
     *
     * @param id                 the slot ID
     * @param interviewProcessId the process this slot belongs to (for filtering)
     * @param startDateTime      start time of the slot
     * @param endDateTime        end time of the slot
     * @param isBooked           whether the slot is already booked
     */
    public record ExistingSlotDTO(UUID id, UUID interviewProcessId, Instant startDateTime, Instant endDateTime, boolean isBooked) {
        /**
         * Creates an ExistingSlotDTO from an InterviewSlot entity.
         *
         * @param slot the entity to convert
         * @return the DTO representation
         */
        public static ExistingSlotDTO fromEntity(InterviewSlot slot) {
            return new ExistingSlotDTO(
                slot.getId(),
                slot.getInterviewProcess().getId(),
                slot.getStartDateTime(),
                slot.getEndDateTime(),
                slot.getIsBooked()
            );
        }
    }
}
