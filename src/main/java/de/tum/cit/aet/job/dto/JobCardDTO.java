package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.service.RelativeTimeLabelService;
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
    String location,
    String professorName,
    Integer workload,
    LocalDate startDate,
    String relativeTime
) {
    public JobCardDTO(
        @NotNull UUID jobId,
        String title,
        String fieldOfStudies,
        Campus location,
        String professorName,
        Integer workload,
        LocalDate startDate,
        Instant createdAt
    ) {
        this(
            jobId,
            title,
            fieldOfStudies,
            formatLocation(location),
            professorName,
            workload,
            startDate,
            RelativeTimeLabelService.getRelativeTime(createdAt)
        );
    }

    /**
     * Formats a {@link Campus} enum value into a capitalized string with the rest in lowercase.
     *
     * @param location The campus enum value to format.
     * @return A human-readable formatted location string.
     */
    public static String formatLocation(Campus location) {
        if (location == null) {
            return "";
        }
        String name = location.name();
        return name.charAt(0) + name.substring(1).toLowerCase();
    }
}
