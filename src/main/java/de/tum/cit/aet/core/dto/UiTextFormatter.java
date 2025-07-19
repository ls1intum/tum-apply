package de.tum.cit.aet.core.dto;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
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
     * Calculates a human-readable string representing how much time has passed since the given {@link LocalDateTime}.
     * - Today
     * - X days ago
     * - X weeks ago
     * - X months ago
     * - X years ago (in 0.5-year intervals)
     *
     * @param time The creation time of the job.
     * @return A string like "Today", "3 days ago", "2.5 years ago".
     */
    public static String getRelativeTimeLabel(LocalDateTime time) {
        if (time == null) {
            return "";
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        long diffDays = ChronoUnit.DAYS.between(time, now);

        if (diffDays == 0) {
            return "Today";
        }
        if (diffDays == 1) {
            return "1 day ago";
        }
        if (diffDays < 7) {
            return diffDays + " days ago";
        }

        long diffWeeks = ChronoUnit.WEEKS.between(time, now);
        if (diffWeeks == 1) {
            return "1 week ago";
        }
        if (diffWeeks < 4) {
            return diffWeeks + " weeks ago";
        }

        long diffMonths = ChronoUnit.MONTHS.between(time, now);
        if (diffMonths <= 1) {
            return "1 month ago";
        }
        if (diffMonths < 12) {
            return diffMonths + " months ago";
        }

        // Years in intervals of 0.5
        double diffYears = Math.round((diffDays / 365.0) * 2) / 2.0;
        return diffYears <= 1 ? "1 year ago" : diffYears + " years ago";
    }
}
