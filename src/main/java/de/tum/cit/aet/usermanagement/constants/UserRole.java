package de.tum.cit.aet.usermanagement.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Enum representing the user groups in the system.
 */
@AllArgsConstructor
@Getter
public enum UserRole {
    APPLICANT("APPLICANT"),
    PROFESSOR("PROFESSOR"),
    ADMIN("ADMIN"),
    EMPLOYEE("EMPLOYEE");

    private final String value;
}
