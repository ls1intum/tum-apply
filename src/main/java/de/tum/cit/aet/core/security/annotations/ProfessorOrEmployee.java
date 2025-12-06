package de.tum.cit.aet.core.security.annotations;

import java.lang.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Marks a controller class or method that can be accessed by professors
 * (users with the PROFESSOR role) or employees (users with the EMPLOYEE role).
 */
@Documented
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasAnyRole('PROFESSOR','EMPLOYEE')")
public @interface ProfessorOrEmployee {}
