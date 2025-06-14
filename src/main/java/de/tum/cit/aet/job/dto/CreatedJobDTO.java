package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.dto.UiTextFormatter;
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
    String state,
    String title,
    LocalDate startDate,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {
    public CreatedJobDTO(
        @NotNull UUID jobId,
        String avatar,
        String professorName,
        JobState state,
        String title,
        LocalDate startDate,
        LocalDateTime createdAt,
        LocalDateTime lastModifiedAt
    ) {
        this(jobId, avatar, professorName, UiTextFormatter.formatEnumValue(state), title, startDate, createdAt, lastModifiedAt);
    }
}
