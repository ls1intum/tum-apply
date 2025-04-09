package de.tum.cit.aet.core.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Enum representing the status of a job application.
 */
@AllArgsConstructor
@Getter
public enum State {
    OPEN("OPEN"),
    IN_REVIEW("IN_REVIEW"),
    CLOSED("CLOSED");

    private final String value;
}
