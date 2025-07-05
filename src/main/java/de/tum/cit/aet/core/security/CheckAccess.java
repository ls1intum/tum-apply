package de.tum.cit.aet.core.security;

import java.lang.annotation.*;

/**
 * Annotation to mark a controller method for access control.
 * The {@link AccessTarget} determines which argument should be validated for access,
 * such as a research group ID or user ID.
 * <p>
 * This annotation is processed by {@link CheckAccessAspect} to ensure that
 * the current user has the proper role and permissions before allowing method execution.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CheckAccess {
    /**
     * Defines which method argument should be used for access control checks.
     * Defaults to {@link AccessTarget#RESEARCH_GROUP_ID}.
     *
     * @return the access target type to check
     */
    AccessTarget type() default AccessTarget.RESEARCH_GROUP_ID;
}
