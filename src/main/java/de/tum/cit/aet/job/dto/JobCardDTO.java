package de.tum.cit.aet.job.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.Campus;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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
        this(jobId, title, fieldOfStudies, formatLocation(location), professorName, workload, startDate, getRelativeTime(createdAt));
    }

    public static String formatLocation(Campus location) {
        if (location == null) {
            return "";
        }
        String name = location.name();
        return name.charAt(0) + name.substring(1).toLowerCase();
    }

    public static String getRelativeTime(Instant createdAt) {
        if (createdAt == null) return "";

        Instant now = Instant.now();
        long diffDays = ChronoUnit.DAYS.between(createdAt, now);

        if (diffDays == 0) return "Today";
        if (diffDays == 1) return "1 day ago";
        if (diffDays < 7) return diffDays + " days ago";

        long diffWeeks = ChronoUnit.WEEKS.between(createdAt, now);
        if (diffWeeks == 1) return "1 week ago";
        if (diffWeeks < 4) return diffWeeks + " weeks ago";

        long diffMonths = ChronoUnit.MONTHS.between(createdAt, now);
        if (diffMonths <= 1) return "1 month ago";
        if (diffMonths < 12) return diffMonths + " months ago";

        double diffYears = Math.round((diffDays / 365.0) * 2) / 2.0;
        return diffYears <= 1 ? "1 year ago" : diffYears + " years ago";
    }
}
