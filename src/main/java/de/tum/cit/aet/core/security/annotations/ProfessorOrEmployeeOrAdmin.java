package de.tum.cit.aet.core.security.annotations;

import java.lang.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Marks a controller class or method that can be accessed by professors
 * (users with the PROFESSOR role), employees (users with the EMPLOYEE role), or admins (users with the ADMIN role).
 */
@Documented
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasAnyRole('PROFESSOR','EMPLOYEE', 'ADMIN')")
public @interface ProfessorOrEmployeeOrAdmin {}
