package de.tum.cit.aet.core.security.annotations;

import java.lang.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

/**
 * Marks a controller class or method that can be accessed by any
 * authenticated user, regardless of their specific role.
 */
@Documented
@Target({ ElementType.TYPE, ElementType.METHOD })
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("isAuthenticated()")
public @interface Authenticated {}
