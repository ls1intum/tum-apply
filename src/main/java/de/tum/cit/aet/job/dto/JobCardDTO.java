package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.JobState;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobCardDTO(
    UUID id,
    String title,
    String fieldOfStudies,
    String location,
    UUID professorId,
    int workload,
    Instant startDate,
    String description,
    JobState state,
    Instant createdAt
) {}
