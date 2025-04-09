package de.tum.cit.aet.core.constants;

/**
 * Enum representing the user groups in the system.
 */
public enum UserGroup {
    PROFESSOR("PROFESSOR"),
    RESEARCH_ASSISTANT("RESEARCH_ASSISTANT"),
    ADMIN("ADMIN"),
    APPLICANT("APPLICANT");

    private final String value;

    UserGroup(String value) {
        this.value = value;
    }

    // Getter
    public String getValue() {
        return value;
    }
}
