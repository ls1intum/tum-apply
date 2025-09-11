package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.auth.OtpCompleteDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

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
        return userRepository.findByEmailIgnoreCase(normalizedEmail);
    }

    /**
     * Creates a new local user. If a user with the same email already exists, no action is taken.
     *
     * @param body the OTP completion request containing email and optional profile information
     */
    @Transactional
    public void createUser(String keycloakUserId, OtpCompleteDTO body) {
        String normalizedEmail = StringUtil.normalize(body.email(), true);
        if (findByEmail(normalizedEmail).isEmpty()) {
            User newUser = new User();
            newUser.setUserId(UUID.fromString(keycloakUserId));
            newUser.setEmail(normalizedEmail);
            if (body.profile() != null) {
                newUser.setFirstName(StringUtil.normalize(body.profile().firstName(), false));
                newUser.setLastName(StringUtil.normalize(body.profile().lastName(), false));
            }
            userRepository.save(newUser);
        }
    }

    /**
     * Updates first/last name if the user exists.
     * Does nothing if the user is not found.
     *
     * @param userId    ID of the user
     * @param firstName optional first name (ignored if null/blank)
     * @param lastName  optional last name (ignored if null/blank)
     */
    @Transactional
    public void updateUser(UUID userId, String firstName, String lastName) {
        userRepository.findById(userId).ifPresent(user -> {
            boolean changed = false;
            String normalizedFirstName = StringUtil.normalize(firstName, false);
            String normalizedLastName = StringUtil.normalize(lastName, false);

            if (!normalizedFirstName.isBlank()) {
                user.setFirstName(normalizedFirstName);
                changed = true;
            }
            if (!normalizedLastName.isBlank()) {
                user.setLastName(normalizedLastName);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
        });
    }
}
