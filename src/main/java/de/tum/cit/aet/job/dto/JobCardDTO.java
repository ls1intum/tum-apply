package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobCardDTO(
    @NotNull UUID jobId,
    String title,
    String fieldOfStudies,
    Campus location,
    @NotNull UUID professorId,
    Integer workload,
    LocalDate startDate,
    Instant createdAt
) {}