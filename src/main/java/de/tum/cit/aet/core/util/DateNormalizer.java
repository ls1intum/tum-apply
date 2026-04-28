package de.tum.cit.aet.core.util;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Normalizes free-form date strings produced by the LLM to ISO {@code YYYY-MM-DD}.
 *
 * <p>Returns {@code null} when the input cannot be parsed by any known format
 * or when the resulting year is implausible (outside {@code 1900..2100}).
 * This is format-level normalization only; semantic checks such as
 * "date of birth must be in the past" are the caller's responsibility.
 */
public final class DateNormalizer {

    private static final int TWO_DIGIT_YEAR_PIVOT = 30;
    private static final int MIN_YEAR = 1900;
    private static final int MAX_YEAR = 2100;

    /**
     * Strict formatters using {@code uuuu} (proleptic year) so impossible dates
     * such as {@code 31/02/1990} are rejected rather than silently coerced.
     */
    private static final List<DateTimeFormatter> FORMATTERS = List.of(
        strict("uuuu-MM-dd"),
        strict("dd.MM.uuuu"),
        strict("MM/dd/uuuu"),
        strict("dd/MM/uuuu"),
        strictWithLocale("MMMM d, uuuu", Locale.ENGLISH),
        strictWithLocale("MMM d, uuuu", Locale.ENGLISH)
    );

    private static final Pattern TWO_DIGIT_YEAR_DATE = Pattern.compile("^(\\d{1,2})([/.\\-])(\\d{1,2})\\2(\\d{2})$");

    private DateNormalizer() {}

    /**
     * Normalizes the given date string to ISO {@code YYYY-MM-DD}.
     *
     * @param input free-form date string
     * @return ISO date string, or {@code null} if no format matched
     */
    public static String normalize(String input) {
        if (input == null) {
            return null;
        }
        String trimmed = stripOrdinalSuffixes(input.trim());
        if (trimmed.isEmpty()) {
            return null;
        }
        String expanded = expandTwoDigitYear(trimmed);
        for (DateTimeFormatter f : FORMATTERS) {
            LocalDate parsed = tryParse(expanded, f);
            if (parsed != null && isPlausible(parsed)) {
                return parsed.toString();
            }
        }
        return null;
    }

    private static LocalDate tryParse(String input, DateTimeFormatter f) {
        try {
            return LocalDate.parse(input, f);
        } catch (DateTimeException e) {
            return null;
        }
    }

    private static boolean isPlausible(LocalDate date) {
        int year = date.getYear();
        return year >= MIN_YEAR && year <= MAX_YEAR;
    }

    private static String stripOrdinalSuffixes(String input) {
        return input.replaceAll("(?<=\\d)(st|nd|rd|th)\\b", "");
    }

    /**
     * Expands a trailing 2-digit year (e.g. {@code 01/01/29}) to 4 digits using
     * a fixed pivot. Inputs that already use a 4-digit year or do not match the
     * expected separator pattern are returned unchanged.
     */
    private static String expandTwoDigitYear(String input) {
        Matcher m = TWO_DIGIT_YEAR_DATE.matcher(input);
        if (!m.matches()) {
            return input;
        }
        int yy = Integer.parseInt(m.group(4));
        int yyyy = yy < TWO_DIGIT_YEAR_PIVOT ? 2000 + yy : 1900 + yy;
        return m.group(1) + m.group(2) + m.group(3) + m.group(2) + yyyy;
    }

    private static DateTimeFormatter strict(String pattern) {
        return DateTimeFormatter.ofPattern(pattern, Locale.ROOT).withResolverStyle(ResolverStyle.STRICT);
    }

    private static DateTimeFormatter strictWithLocale(String pattern, Locale locale) {
        return DateTimeFormatter.ofPattern(pattern, locale).withResolverStyle(ResolverStyle.STRICT);
    }
}
