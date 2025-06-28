package de.tum.cit.aet.core.security;

import de.tum.cit.aet.core.service.support.CurrentUserService;
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

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class CheckAccessAspect {

    private final CurrentUserService currentUserService;

    @Around("@annotation(CheckAccess)")
    public Object checkAccess(ProceedingJoinPoint joinPoint) throws Throwable {
        for (Object arg : joinPoint.getArgs()) {
            UUID researchGroupId = extractGroupId(arg);
            if (researchGroupId != null && !hasAccess(researchGroupId)) {
                throw new AccessDeniedException("Access denied to research group " + researchGroupId);
            }
        }

        return joinPoint.proceed();
    }

    private boolean hasAccess(@Nonnull UUID researchGroupId) {
        return currentUserService.isAdminOrProfessorOf(researchGroupId);
    }

    private @Nullable UUID extractGroupId(Object arg) {
        if (arg == null) return null;

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
