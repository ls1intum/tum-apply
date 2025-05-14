package de.tum.cit.aet.core.security;

/**
 * Central place for role constants used in authorization checks.
 * These roles are evaluated against values in the user_research_group_roles table.
 */
public final class AuthoritiesConstants {

    public static final String ADMIN = "ADMIN";
    public static final String PROFESSOR = "PROFESSOR";
    public static final String APPLICANT = "APPLICANT";
    public static final String ANONYMOUS = "ANONYMOUS";

    private AuthoritiesConstants() {}
}
