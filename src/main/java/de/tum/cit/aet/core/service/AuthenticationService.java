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

    @Transactional
    public User provisionUserIfMissing(String preferredUsername, String firstName, String lastName) {
        String normalizedEmail = preferredUsername.toLowerCase(Locale.ROOT);
        return userRepository
            .findWithResearchGroupRolesByEmailIgnoreCase(normalizedEmail)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(normalizedEmail);
                newUser.setFirstName(firstName);
                newUser.setLastName(lastName);
                newUser.setSelectedLanguage("en");
                User savedUser = userRepository.save(newUser);

                UserResearchGroupRole defaultRole = new UserResearchGroupRole();
                defaultRole.setUser(newUser);
                defaultRole.setRole(UserRole.APPLICANT);
                userResearchGroupRoleRepository.save(defaultRole);

                return savedUser;
            });
    }
}
