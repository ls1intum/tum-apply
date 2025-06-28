package de.tum.cit.aet.core.security;

import de.tum.cit.aet.core.service.support.CurrentUserService;
import jakarta.annotation.Nonnull;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.data.domain.AuditorAware;
import org.springframework.stereotype.Component;

/**
 * Implementation of {@link AuditorAware} based on Spring Security.
 */
@Component
public class SpringSecurityAuditorAware implements AuditorAware<UUID> {

    private final ObjectFactory<CurrentUserService> currentUserServiceFactory;

    public SpringSecurityAuditorAware(ObjectFactory<CurrentUserService> currentUserServiceFactory) {
        this.currentUserServiceFactory = currentUserServiceFactory;
    }

    @Override
    @Nonnull
    public Optional<UUID> getCurrentAuditor() {
        return Optional.ofNullable(currentUserServiceFactory.getObject().getUserId());
    }
}
