package de.tum.cit.aet.core.service;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.util.Locale;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
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
     * Provisions a new user in the database if it does not already exist.
     * The user ID is taken from the JWT subject. This method avoids
     * updating the user if already present to prevent concurrent modification errors.
     *
     * @param jwt The decoded JWT token.
     * @return the existing or newly created {@link User} entity
     */
    @Transactional
    public User provisionUserIfMissing(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        User user = userRepository
            .findWithResearchGroupRolesByUserId(userId)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setUserId(userId);
                newUser.setSelectedLanguage("en");
                return newUser;
            });

        user.setEmail(jwt.getClaimAsString("email").toLowerCase(Locale.ROOT));
        user.setFirstName(jwt.getClaimAsString("given_name"));
        user.setLastName(jwt.getClaimAsString("family_name"));
        userRepository.save(user);

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
