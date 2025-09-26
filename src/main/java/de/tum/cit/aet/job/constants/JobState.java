package de.tum.cit.aet.job.constants;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Enum representing the status of a job application.
 */
@AllArgsConstructor
@Getter
public enum JobState {
    DRAFT("DRAFT"),
    PUBLISHED("PUBLISHED"),
    CLOSED("CLOSED"),
    APPLICANT_FOUND("APPLICANT_FOUND");

    private final String value;

    private static final Map<String, JobState> LOOKUP = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(
                    JobState::getValue, Function.identity()));

    public static JobState fromValue(String value) {
        if (value == null)
            return null;
        return LOOKUP.get(value.toUpperCase(Locale.ROOT));
    }
}
