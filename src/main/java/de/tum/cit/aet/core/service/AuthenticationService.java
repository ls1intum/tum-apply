package de.tum.cit.aet.core.service;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    public AuthenticationService(UserRepository userRepository, UserResearchGroupRoleRepository userResearchGroupRoleRepository) {
        this.userRepository = userRepository;
        this.userResearchGroupRoleRepository = userResearchGroupRoleRepository;
    }

    /**
     * Ensures that a user with the given email exists in the system.
     * If no user is found, a new one is created with the provided email, first and last name.
     * If the user has no assigned role, the default role {@code APPLICANT} is assigned.
     *
     * @param email     the email address used to identify the user (case-insensitive)
     * @param firstName the first name to set if a new user is created
     * @param lastName  the last name to set if a new user is created
     * @return the existing or newly created {@link User} entity
     */
    @Transactional
    public User provisionUserIfMissing(String email, String firstName, String lastName) {
        String normalizedEmail = email.toLowerCase(Locale.ROOT);
        User user = userRepository
            .findWithResearchGroupRolesByEmailIgnoreCase(normalizedEmail)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(normalizedEmail);
                newUser.setFirstName(firstName);
                newUser.setLastName(lastName);
                newUser.setSelectedLanguage("en");
                return userRepository.save(newUser);
            });

        boolean hasRoles = userResearchGroupRoleRepository.existsByUserUserId(user.getUserId());
        if (!hasRoles) {
            UserResearchGroupRole defaultRole = new UserResearchGroupRole();
            defaultRole.setUser(user);
            defaultRole.setRole(UserRole.APPLICANT);
            userResearchGroupRoleRepository.save(defaultRole);
        }

        return user;
    }
}
