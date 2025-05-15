package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    public UserService(UserRepository userRepository, UserResearchGroupRoleRepository userResearchGroupRoleRepository) {
        this.userRepository = userRepository;
        this.userResearchGroupRoleRepository = userResearchGroupRoleRepository;
    }

    /**
     * Automatically creates a user in the database if not already present.
     *
     * @param preferredUsername The username/email from the JWT token.
     * @param firstName         The first name from the JWT token.
     * @param lastName          The last name from the JWT token.
     * @return The existing or newly created User entity.
     */
    @Transactional
    public User provisionUserIfMissing(String preferredUsername, String firstName, String lastName) {
        return userRepository
            .findByEmailIgnoreCase(preferredUsername)
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setEmail(preferredUsername);
                newUser.setFirstName(firstName);
                newUser.setLastName(lastName);
                newUser.setSelectedLanguage("en"); // default language
                return userRepository.save(newUser);
            });
    }

    public List<String> getRolesForUser(User user) {
        return userResearchGroupRoleRepository.findByUserUserId(user.getUserId()).stream().map(role -> role.getRole().name()).toList();
    }

    // TODO: add right exception after PR was merged
    public User findByEmail(String email) {
        return userRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(() -> new IllegalStateException("User not found with email: " + email));
    }
}
