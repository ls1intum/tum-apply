package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobCardDTO(
    UUID id,
    String title,
    String fieldOfStudies,
    Campus location,
    UUID professorId,
    int workload,
    LocalDate startDate,
    Instant createdAt
) {}
