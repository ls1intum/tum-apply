package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.core.dto.UiTextFormatter;
import de.tum.cit.aet.job.constants.Campus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record JobCardDTO(
    @NotNull UUID jobId,
    @NotNull String title,
    @NotNull String fieldOfStudies,
    @NotNull String location,
    @NotNull String professorName,
    UUID applicationId,
    ApplicationState applicationState,
    Integer workload,
    LocalDate startDate,
    String relativeTimeEnglish,
    String relativeTimeGerman
) {
    public JobCardDTO(
        @NotNull UUID jobId,
        @NotNull String title,
        @NotNull String fieldOfStudies,
        @NotNull Campus location,
        @NotNull String professorName,
        UUID applicationId,
        ApplicationState applicationState,
        Integer workload,
        LocalDate startDate,
        LocalDate endDate
    ) {
        this(
            jobId,
            title,
            fieldOfStudies,
            UiTextFormatter.formatEnumValue(location),
            professorName,
            applicationId,
            applicationState,
            workload,
            startDate,
            UiTextFormatter.getTimeLeftLabelEnglish(endDate),
            UiTextFormatter.getTimeLeftLabelGerman(endDate)
        );
    }
}
