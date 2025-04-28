package de.tum.cit.aet.job.constants;

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
}
