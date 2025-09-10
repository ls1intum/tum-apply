package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Finds a user by email in a case-insensitive manner.
     * Returns an empty Optional on null/blank input or when no user exists.
     *
     * @param email raw email input
     * @return optional user
     */
    public Optional<User> findByEmail(String email) {
        String normalizedEmail = StringUtil.normalize(email, true);
        if (normalizedEmail.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByEmailIgnoreCase(email);
    }

    /**
     * Creates a new local user. If a user with the same email already exists, the existing user is returned unchanged.
     *
     * @param email     normalized or raw email address
     * @param firstName optional first name (can be blank)
     * @param lastName  optional last name (can be blank)
     * @return the persisted (or existing) User entity
     */
    @Transactional
    public User createUser(String email, String firstName, String lastName) {
        String normalizedEmail = StringUtil.normalize(email, true);
        return findByEmail(normalizedEmail).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(normalizedEmail);
            newUser.setFirstName(StringUtil.normalize(firstName, false));
            newUser.setLastName(StringUtil.normalize(lastName, false));
            return userRepository.save(newUser);
        });
    }
}
