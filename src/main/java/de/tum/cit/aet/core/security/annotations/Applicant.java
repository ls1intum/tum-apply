package de.tum.cit.aet.core.security.annotations;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * Marks a controller class or method that can be accessed only by
 * applicants (users with the APPLICANT role).
 */
@Documented
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole('APPLICANT')")
public @interface Applicant {}
