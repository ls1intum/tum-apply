package de.tum.cit.aet.core.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Enum representing the user groups in the system.
 */
@AllArgsConstructor
@Getter
public enum UserGroup {
    PROFESSOR("PROFESSOR"),
    RESEARCH_ASSISTANT("RESEARCH_ASSISTANT"),
    ADMIN("ADMIN"),
    APPLICANT("APPLICANT");

    private final String value;
}
