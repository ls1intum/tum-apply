package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record InterviewProcessDTO(
    UUID id,
    UUID jobId,
    String jobTitle,
    Instant createdAt
) {}
