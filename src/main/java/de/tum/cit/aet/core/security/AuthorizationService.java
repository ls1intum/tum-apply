package de.tum.cit.aet.core.security;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {

    private final CurrentUserService currentUserService;

    public AuthorizationService(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    public boolean isAdminOfResearchGroup(UUID researchGroupId) {
        User user = currentUserService.getCurrentUser();

        return user
            .getResearchGroupRoles()
            .stream()
            .anyMatch(role -> role.getResearchGroup().getId().equals(researchGroupId) && role.getRole() == UserRole.ADMIN);
    }

    public boolean isMemberOfResearchGroup(UUID researchGroupId) {
        User user = currentUserService.getCurrentUser();

        return user.getResearchGroupRoles().stream().anyMatch(role -> role.getResearchGroup().getId().equals(researchGroupId));
    }

    public boolean hasRole(UserRole role) {
        User user = currentUserService.getCurrentUser();

        return user.getResearchGroupRoles().stream().anyMatch(r -> r.getRole() == role);
    }
}
