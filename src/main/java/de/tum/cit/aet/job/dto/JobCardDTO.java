package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.dto.UiTextFormatter;
import de.tum.cit.aet.job.constants.Campus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobCardDTO(
    @NotNull UUID jobId,
    @NotNull String title,
    String fieldOfStudies,
    String location,
    String professorName,
    Integer workload,
    LocalDate startDate,
    String relativeTime
) {
    public JobCardDTO(
        @NotNull UUID jobId,
        @NotNull String title,
        String fieldOfStudies,
        Campus location,
        String professorName,
        Integer workload,
        LocalDate startDate,
        LocalDateTime createdAt
    ) {
        this(
            jobId,
            title,
            fieldOfStudies,
            UiTextFormatter.formatEnumValue(location),
            professorName,
            workload,
            startDate,
            UiTextFormatter.getRelativeTimeLabel(createdAt)
        );
    }
}
