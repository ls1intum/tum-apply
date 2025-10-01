package de.tum.cit.aet.core.security;

import de.tum.cit.aet.core.service.CurrentUserService;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Aspect to check whether the current user has access to the given research group ID.
 * Inspects method arguments for UUIDs or objects with a getResearchGroupId() method.
 * Throws an AccessDeniedException if access is denied.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class CheckAccessAspect {

    private final CurrentUserService currentUserService;

    /**
     * Intercepts methods annotated with {@link CheckAccess} and checks access based on the method arguments.
     *
     * @param joinPoint   the intercepted join point
     * @param checkAccess the CheckAccess annotation instance
     * @return the result of the method execution if access is granted
     * @throws Throwable if access is denied or the method throws an exception
     */
    @Around("@annotation(checkAccess)")
    public Object checkAccess(ProceedingJoinPoint joinPoint, CheckAccess checkAccess) throws Throwable {
        for (Object arg : joinPoint.getArgs()) {
            switch (checkAccess.target()) {
                case RESEARCH_GROUP_ID -> {
                    UUID researchGroupId = extractGroupId(arg);
                    if (researchGroupId!=null) {
                        hasAccess(researchGroupId);
                        return joinPoint.proceed();
                    }
                }
                case USER_ID -> {
                    UUID userId = extractUuid(arg, "getUserId");
                    if (userId!=null && !currentUserService.isCurrentUserOrAdmin(userId)) {
                        throw new AccessDeniedException("Access denied for user ID " + userId);
                    }
                    if (userId!=null) {
                        return joinPoint.proceed();
                    }
                }
                case PROFESSOR_ID -> {
                    UUID professorId = extractUuid(arg, "getProfessorId");
                    if (professorId!=null) {
                        boolean allowed = currentUserService.isAdmin() ||
                            (currentUserService.isCurrentUser(professorId) && currentUserService.isProfessor());
                        if (!allowed) {
                            throw new AccessDeniedException("Access denied: Not professor or admin for user ID " + professorId);
                        }
                        return joinPoint.proceed();
                    }
                }
            }
        }
        return joinPoint.proceed();
    }

    /**
     * Checks whether the current user is admin or professor of the given research group.
     *
     * @param researchGroupId the ID of the research group
     * @throws AccessDeniedException if access is denied
     */
    private void hasAccess(@Nonnull UUID researchGroupId) {
        currentUserService.isAdminOrMemberOf(researchGroupId);
    }

    /**
     * Extracts the research group ID from the given method argument.
     * Supports direct UUID arguments or objects with a getResearchGroupId() method.
     *
     * @param arg the method argument
     * @return the extracted research group ID, or null if not applicable
     */
    private @Nullable UUID extractGroupId(Object arg) {
        if (arg==null) {
            return null;
        }

        // Case 1: Check if the argument is the research group id
        if (arg instanceof UUID researchGroupId) {
            return researchGroupId;
        }

        // Case 2: Check if the argument has a method getResearchGroupId()
        try {
            var method = arg.getClass().getMethod("getResearchGroupId");
            Object value = method.invoke(arg);
            if (value instanceof UUID uuid) {
                return uuid;
            }
        } catch (Exception ignored) {
            // Method getResearchGroupId not found or not accessible, fallback to null
        }

        return null;
    }

    /**
     * Extracts a UUID from the given argument using the specified accessor method name.
     *
     * @param arg          the method argument
     * @param accessorName the name of the accessor method to call if arg is not a UUID or String
     * @return the extracted UUID, or null if not applicable
     */
    private @Nullable UUID extractUuid(Object arg, String accessorName) {
        switch (arg) {
            case null -> {
                return null;
            }
            case UUID uuid -> {
                return uuid;
            }
            case String s -> {
                try {
                    return UUID.fromString(s);
                } catch (Exception ignored) {
                }
            }
            default -> {
            }
        }
        try {
            var method = arg.getClass().getMethod(accessorName);
            Object value = method.invoke(arg);
            if (value instanceof UUID u) {
                return u;
            }
            if (value instanceof String s) {
                try {
                    return UUID.fromString(s);
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
            // no accessor available
        }
        return null;
    }
}
