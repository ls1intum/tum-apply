package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.JobState;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record CreatedJobDTO(
    @NotNull UUID jobId,
    String avatar,
    String professorName,
    JobState state,
    @NotNull String title,
    LocalDate startDate,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {}
