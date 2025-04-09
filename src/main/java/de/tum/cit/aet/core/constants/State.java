package de.tum.cit.aet.core.constants;

/**
 * Enum representing the status of a job application.
 */
public enum State {
    OPEN("OPEN"),
    IN_REVIEW("IN_REVIEW"),
    CLOSED("CLOSED");

    private final String value;

    State(String value) {
        this.value = value;
    }

    // Getter
    public String getValue() {
        return value;
    }
}
