package de.tum.cit.aet.core.dto;

import java.time.LocalDate;
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

    /**
     * Calculates a human-readable label indicating how much time is left until a given application deadline.
     *
     * If the deadline is null, a default message like "No application deadline" is returned to indicate
     * an open or unspecified deadline.
     *
     * Examples of returned values:
     * - "No application deadline" (if deadline is null)
     * - "Apply by today"
     * - "3 days left to apply"
     * - "2 weeks left to apply"
     * - "5 months left to apply"
     * - "2.5 years left to apply"
     *
     * @param deadline The application deadline as a {@link LocalDate}.
     * @return A human-readable label indicating the time remaining until the deadline.
     */
    public static String getTimeLeftLabel(LocalDate deadline) {
        if (deadline == null) {
            return "No application deadline";
        }

        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        long daysLeft = ChronoUnit.DAYS.between(today, deadline);

        if (daysLeft == 0) {
            return "Apply by today";
        }
        if (daysLeft == 1) {
            return "1 day left to apply";
        }
        if (daysLeft < 7) {
            return daysLeft + " days left to apply";
        }

        long weeksLeft = ChronoUnit.WEEKS.between(today, deadline);
        if (weeksLeft == 1) {
            return "1 week left to apply";
        }
        if (weeksLeft < 4) {
            return weeksLeft + " weeks left to apply";
        }

        long monthsLeft = ChronoUnit.MONTHS.between(today, deadline);
        if (monthsLeft <= 1) {
            return "1 month left to apply";
        }
        if (monthsLeft < 12) {
            return monthsLeft + " months left to apply";
        }

        double yearsLeft = Math.round((daysLeft / 365.0) * 2) / 2.0;
        return yearsLeft <= 1 ? "1 year left to apply" : yearsLeft + " years left to apply";
    }
}
