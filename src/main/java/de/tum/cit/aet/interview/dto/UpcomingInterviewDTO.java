package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO for upcoming interviews shown on the professor dashboard / overview.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record UpcomingInterviewDTO(
    UUID id,
    Instant startDateTime,
    Instant endDateTime,
    String intervieweeName,
    String jobTitle,
    String location,
    UUID processId,
    UUID intervieweeId
) {}
