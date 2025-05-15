package de.tum.cit.aet.core.service;

import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.util.List;
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
            .findWithRolesByEmailIgnoreCase(normalizedEmail)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(normalizedEmail);
                newUser.setFirstName(firstName);
                newUser.setLastName(lastName);
                newUser.setSelectedLanguage("en");
                return userRepository.save(newUser);
            });
    }

    public List<String> getRolesForUser(User user) {
        return userResearchGroupRoleRepository.findByUserUserId(user.getUserId()).stream().map(role -> role.getRole().name()).toList();
    }
}
