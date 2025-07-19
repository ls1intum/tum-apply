package de.tum.cit.aet.core.security;

import jakarta.annotation.Nonnull;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Implementation of {@link AuditorAware} based on Spring Security.
 */
@Component
public class SpringSecurityAuditorAware implements AuditorAware<UUID> {

    @Override
    @Nonnull
    public Optional<UUID> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!(authentication instanceof JwtAuthenticationToken jwt)) {
            return Optional.empty();
        }

        try {
            return Optional.of(UUID.fromString(jwt.getToken().getSubject()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
