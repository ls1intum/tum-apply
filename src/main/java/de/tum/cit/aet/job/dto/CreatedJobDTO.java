package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.JobState;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.UUID;
import java.util.stream.Collectors;

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
            formatJobState(state),
            title,
            startDate,
            formatTimeToLocalDate(createdAt),
            formatTimeToLocalDate(lastModifiedAt)
        );
    }

    /**
     * Converts an {@link Instant} timestamp to a {@link LocalDate}
     * using the system's default time zone.
     *
     * @param time the {@link Instant} to convert
     * @return a {@link LocalDate} representing the same date in the system's time zone
     */
    public static LocalDate formatTimeToLocalDate(Instant time) {
        return time.atZone(java.time.ZoneId.systemDefault()).toLocalDate();
    }

    /**
     * Converts a {@link JobState} enum constant into a human-readable format.
     * For example, "APPLICANT_FOUND" becomes "Applicant Found".
     *
     * @param state the {@link JobState} to format
     * @return the formatted string representation of the job state, or an empty string if null
     */
    public static String formatJobState(JobState state) {
        if (state == null) {
            return "";
        }
        return Arrays.stream(state.name().split("_"))
            .map(part -> part.substring(0, 1).toUpperCase() + part.substring(1).toLowerCase())
            .collect(Collectors.joining(" "));
    }
}
