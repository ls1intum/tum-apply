package de.tum.cit.aet.core.security.annotations;

import java.lang.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Marks a controller class or method that can be accessed only by
 * administrators (users with the ADMIN role).
 */
@Documented
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole('ADMIN')")
public @interface Admin {}
