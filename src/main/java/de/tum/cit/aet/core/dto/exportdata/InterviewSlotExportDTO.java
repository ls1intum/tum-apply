package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.ZonedDateTime;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record InterviewSlotExportDTO(
    String jobTitle,
    ZonedDateTime start,
    ZonedDateTime end,
    String location,
    String streamLink,
    Boolean isBooked
) {}
