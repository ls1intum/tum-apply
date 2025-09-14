package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Supplier;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final KeycloakUserService keycloakUserService;

    public UserService(UserRepository userRepository, UserResearchGroupRoleRepository userResearchGroupRoleRepository, KeycloakUserService keycloakUserService) {
        this.userRepository = userRepository;
        this.userResearchGroupRoleRepository = userResearchGroupRoleRepository;
        this.keycloakUserService = keycloakUserService;
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
     * Upserts a user in the database and assigns the APPLICANT role.
     * - Normalizes input values (never null, may be blank)
     * - Creates a new user if missing, otherwise updates changed fields only
     * - Assigns the APPLICANT role when no roles are present
     * <p>
     * Note: This method does not throw if names/emails are blank; callers may validate earlier.
     *
     * @param keycloakUserId the Keycloak user ID to associate with the user
     * @param email          the user's email (can be null/blank)
     * @param firstName      optional first name (can be null/blank)
     * @param lastName       optional last name (can be null/blank)
     * @return the managed User entity
     */
    @Transactional
    public User upsertUser(String keycloakUserId, String email, String firstName, String lastName) {
        UUID userId = UUID.fromString(keycloakUserId);
        final String normalizedEmail = StringUtil.normalize(email, true);
        final String normalizedFirstName = StringUtil.normalize(firstName, false);
        final String normalizedLastName = StringUtil.normalize(lastName, false);

        Optional<User> existingUser = userRepository.findWithResearchGroupRolesByUserId(userId);
        final boolean isNewUser = existingUser.isEmpty();

        User user = existingUser.orElseGet(() ->
            createNewUser(userId, normalizedEmail, normalizedFirstName, normalizedLastName)
        );

        boolean updated = isNewUser;
        updated |= setIfPresentAndChanged(user::getEmail, user::setEmail, normalizedEmail);
        updated |= setIfPresentAndChanged(user::getFirstName, user::setFirstName, normalizedFirstName);
        updated |= setIfPresentAndChanged(user::getLastName, user::setLastName, normalizedLastName);

        if (updated) {
            user = userRepository.save(user);
        }

        assignApplicantRoleIfEmpty(user);
        return user;
    }

    @Transactional
    public void updateNames(String userId, String firstName, String lastName) {
        boolean updated = keycloakUserService.updateProfile(userId, firstName, lastName);
        if (updated) {
            User user = userRepository.findById(UUID.fromString(userId)).orElseThrow(() -> EntityNotFoundException.forId("User", userId));

            user.setFirstName(firstName);
            user.setLastName(lastName);

            userRepository.save(user);
        }
    }

    /**
     * Ensures the user has at least one role by assigning {@link UserRole APPLICANT} when none are present.
     *
     * @param user the managed user entity to update; must not be {@code null}
     */
    private void assignApplicantRoleIfEmpty(User user) {
        if (user.getResearchGroupRoles() == null || user.getResearchGroupRoles().isEmpty()) {
            UserResearchGroupRole defaultRole = new UserResearchGroupRole();
            defaultRole.setUser(user);
            defaultRole.setRole(UserRole.APPLICANT);
            userResearchGroupRoleRepository.save(defaultRole);
        }
    }

    /**
     * Factory for a new {@link User} with normalized values.
     *
     * @param userId    the persistent user identifier (Keycloak UUID)
     * @param email     normalized email
     * @param firstName normalized first name
     * @param lastName  normalized last name
     * @return a new {@link User} instance
     */
    private User createNewUser(UUID userId, String email, String firstName, String lastName) {
        User newUser = new User();
        newUser.setUserId(userId);
        newUser.setEmail(email);
        newUser.setFirstName(firstName);
        newUser.setLastName(lastName);
        return newUser;
    }

    /**
     * Updates a string field if the proposed value is non-blank and different from the current value.     *
     *
     * @param getter   supplier of the current field value
     * @param setter   consumer used to set the new value
     * @param newValue the proposed new value; updates only when non-blank and not equal to the current value
     * @return {@code true} if the field was updated; {@code false} otherwise
     */
    private boolean setIfPresentAndChanged(Supplier<String> getter, Consumer<String> setter, String newValue) {
        if (newValue == null || newValue.isBlank()) {
            return false;
        }
        String current = getter.get();
        if (Objects.equals(current, newValue)) {
            return false;
        }
        setter.accept(newValue);
        return true;
    }
}
