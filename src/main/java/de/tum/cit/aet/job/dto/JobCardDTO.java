package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.JobState;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobCardDTO(
    @NotNull UUID id,
    @NotNull String title,
    @NotNull String fieldOfStudies,
    @NotNull String location,
    @NotNull UUID professorId,
    @NotNull int workload,
    @NotNull Instant startDate,
    @NotNull String description,
    @NotNull JobState state,
    @NotNull Instant createdAt
) {}
