package de.tum.cit.aet.core.service.support;

import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.security.SecurityUtils;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Service;
import org.springframework.web.context.WebApplicationContext;

@Service
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    private CurrentUser currentUser;

    public CurrentUser getCurrentUser() {
        if (currentUser == null) {
            UUID userId = SecurityUtils.getCurrentUserId();
            User user = userRepository
                .findWithResearchGroupRolesByUserId(userId)
                .orElseThrow(() -> new AccessDeniedException("User not found"));

            List<ResearchGroupRole> roles = user
                .getResearchGroupRoles()
                .stream()
                .map(r ->
                    new ResearchGroupRole(r.getRole(), r.getResearchGroup() != null ? r.getResearchGroup().getResearchGroupId() : null)
                )
                .toList();

            this.currentUser = new CurrentUser(user.getUserId(), user.getEmail(), user.getFirstName(), user.getLastName(), roles);
        }
        return currentUser;
    }

    public UUID getUserId() {
        return getCurrentUser().userId();
    }

    public boolean isAdmin() {
        return getCurrentUser().isAdmin();
    }

    public boolean isProfessor() {
        return getCurrentUser().isProfessor();
    }

    public Optional<UUID> getResearchGroupIdIfProfessor() {
        return getCurrentUser().getResearchGroupIdIfProfessor();
    }

    public boolean isAdminOrProfessorOf(UUID researchGroupId) {
        return isAdmin() || getResearchGroupIdIfProfessor().map(id -> id.equals(researchGroupId)).orElse(false);
    }
}
