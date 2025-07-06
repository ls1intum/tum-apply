package de.tum.cit.aet.core.security;

import de.tum.cit.aet.core.service.CurrentUserService;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

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
            switch (checkAccess.type()) {
                case RESEARCH_GROUP_ID -> {
                    UUID researchGroupId = extractGroupId(arg);
                    if (researchGroupId != null && !hasAccess(researchGroupId)) {
                        throw new AccessDeniedException("Access denied to research group " + researchGroupId);
                    }
                }
                case USER_ID -> {
                    if (arg instanceof UUID userId && !currentUserService.isCurrentUserOrAdmin(userId)) {
                        throw new AccessDeniedException("Access denied for user ID " + userId);
                    }
                }
                case PROFESSOR_ID -> {
                    if (arg instanceof UUID professorId) {
                        if (
                            !(currentUserService.isAdmin() ||
                                (currentUserService.isCurrentUser(professorId) && currentUserService.isProfessor()))
                        ) {
                            throw new AccessDeniedException("Access denied: Not professor or admin for user ID " + professorId);
                        }
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
     * @return true if the user has access, false otherwise
     */
    private boolean hasAccess(@Nonnull UUID researchGroupId) {
        return currentUserService.isAdminOrProfessorOf(researchGroupId);
    }

    /**
     * Extracts the research group ID from the given method argument.
     * Supports direct UUID arguments or objects with a getResearchGroupId() method.
     *
     * @param arg the method argument
     * @return the extracted research group ID, or null if not applicable
     */
    private @Nullable UUID extractGroupId(Object arg) {
        if (arg == null) {
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
}
