package de.tum.cit.aet.core.security.annotations;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * Marks a controller class or method that can be accessed by professors
 * (users with the PROFESSOR role) or by administrators.
 */
@Documented
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasAnyRole('PROFESSOR','ADMIN')")
public @interface ProfessorOrAdmin {}
