package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.dto.UiTextFormatter;
import de.tum.cit.aet.job.constants.JobState;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record CreatedJobDTO(
    @NotNull UUID jobId,
    String avatar,
    String professorName,
    String state,
    String title,
    LocalDate startDate,
    LocalDate createdAt,
    LocalDate lastModifiedAt
) {
    public CreatedJobDTO(
        @NotNull UUID jobId,
        String avatar,
        String professorName,
        JobState state,
        String title,
        LocalDate startDate,
        Instant createdAt,
        Instant lastModifiedAt
    ) {
        this(
            jobId,
            avatar,
            professorName,
            UiTextFormatter.formatEnumValue(state),
            title,
            startDate,
            UiTextFormatter.formatTimeToLocalDate(createdAt),
            UiTextFormatter.formatTimeToLocalDate(lastModifiedAt)
        );
    }
}
