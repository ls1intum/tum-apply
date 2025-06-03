package de.tum.cit.aet.core.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.stream.Collectors;

public class UiTextFormatter {

    /**
     * Formats any enum constant into a human-readable format.
     * For example, "APPLICANT_FOUND" becomes "Applicant Found".
     *
     * @param value the enum constant to format
     * @return the formatted string, or an empty string if null
     */
    public static String formatEnumValue(Enum<?> value) {
        if (value == null) {
            return "";
        }
        return Arrays.stream(value.name().split("_"))
            .map(part -> part.substring(0, 1).toUpperCase() + part.substring(1).toLowerCase())
            .collect(Collectors.joining(" "));
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
     * Calculates a human-readable string representing how much time has passed since the given {@link Instant}.
     * - Today
     * - X days ago
     * - X weeks ago
     * - X months ago
     * - X years ago (in 0.5-year intervals)
     *
     * @param instant The creation timestamp of the job.
     * @return A string like "Today", "3 days ago", "2.5 years ago".
     */
    public static String getRelativeTimeLabel(Instant instant) {
        if (instant == null) return "";

        Instant now = Instant.now();
        long diffDays = ChronoUnit.DAYS.between(instant, now);

        if (diffDays == 0) return "Today";
        if (diffDays == 1) return "1 day ago";
        if (diffDays < 7) return diffDays + " days ago";

        long diffWeeks = ChronoUnit.WEEKS.between(instant, now);
        if (diffWeeks == 1) return "1 week ago";
        if (diffWeeks < 4) return diffWeeks + " weeks ago";

        long diffMonths = ChronoUnit.MONTHS.between(instant, now);
        if (diffMonths <= 1) return "1 month ago";
        if (diffMonths < 12) return diffMonths + " months ago";

        double diffYears = Math.round((diffDays / 365.0) * 2) / 2.0;
        return diffYears <= 1 ? "1 year ago" : diffYears + " years ago";
    }
}
