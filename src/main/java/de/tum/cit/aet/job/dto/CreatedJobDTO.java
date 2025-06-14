package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.dto.UiTextFormatter;
import de.tum.cit.aet.job.constants.JobState;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record CreatedJobDTO(
    @NotNull UUID jobId,
    String avatar,
    String professorName,
    String state,
    String title,
    LocalDate startDate,
    ZonedDateTime createdAt,
    ZonedDateTime lastModifiedAt
) {
    public CreatedJobDTO(
        @NotNull UUID jobId,
        String avatar,
        String professorName,
        JobState state,
        String title,
        LocalDate startDate,
        ZonedDateTime createdAt,
        ZonedDateTime lastModifiedAt
    ) {
        this(jobId, avatar, professorName, UiTextFormatter.formatEnumValue(state), title, startDate, createdAt, lastModifiedAt);
    }
}
