package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.exception.InvalidParameterException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO for creating multiple interview slots.
 * Client generates the slots - server validates and saves.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record CreateSlotsDTO(@NotEmpty List<@Valid SlotInput> slots) {
    /**
     * Definition of a single slot to be created.
     */
    public record SlotInput(
        @NotNull LocalDate date,

        @NotNull LocalTime startTime,

        @NotNull LocalTime endTime,

        @NotBlank @Size(max = 255) String location,

        @Size(max = 500) String streamLink
    ) {
        public SlotInput {
            if (endTime != null && startTime != null && !endTime.isAfter(startTime)) {
                throw new InvalidParameterException("End time must be after start time");
            }
        }
    }
}
