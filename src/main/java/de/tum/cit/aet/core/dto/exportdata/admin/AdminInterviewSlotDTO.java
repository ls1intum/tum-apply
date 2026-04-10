package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/** Flat representation of an {@link de.tum.cit.aet.interview.domain.InterviewSlot}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminInterviewSlotDTO(
    UUID slotId,
    Instant startDateTime,
    Instant endDateTime,
    String location,
    String streamLink,
    Boolean booked
) {}
