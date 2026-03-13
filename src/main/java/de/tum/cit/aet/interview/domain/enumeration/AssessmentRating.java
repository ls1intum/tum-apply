package de.tum.cit.aet.interview.domain.enumeration;

import java.util.Arrays;

/**
 * Enumeration for Interviewee Assessment Rating.
 * Maps Likert scale integer values (-2 to 2) to semantic names.
 */
public enum AssessmentRating {
    POOR(-2),
    FAIR(-1),
    SATISFACTORY(0),
    GOOD(1),
    EXCELLENT(2);

    private final int value;

    AssessmentRating(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    /**
     * Converts an integer value to the corresponding AssessmentRating.
     *
     * @param value the integer value (-2 to 2)
     * @return the matching AssessmentRating, or null if value is null
     * @throws IllegalArgumentException if the value is invalid
     */
    public static AssessmentRating fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        return Arrays.stream(values())
            .filter(r -> r.value == value)
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Invalid rating value: " + value));
    }
}
