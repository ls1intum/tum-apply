package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private static final Duration LAST_ACTIVITY_UPDATE_THRESHOLD = Duration.ofHours(24);

    public UserService(UserRepository userRepository, UserResearchGroupRoleRepository userResearchGroupRoleRepository) {
        this.userRepository = userRepository;
        this.userResearchGroupRoleRepository = userResearchGroupRoleRepository;
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
     * - firstName and lastName are ONLY set during initial user creation from Keycloak values
     * - After creation, firstName and lastName are stored in the database and not synced with Keycloak
     * - Updates lastActivityAt if older than 24 hours
     * - Assigns the APPLICANT role when no roles are present
     * <p>
     * Note: This method does not throw if names/emails are blank; callers may validate earlier.
     *
     * @param keycloakUserId the Keycloak user ID to associate with the user
     * @param email          the user's email (can be null/blank)
     * @param firstName      optional first name from Keycloak (only used for new users)
     * @param lastName       optional last name from Keycloak (only used for new users)
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

        User user = existingUser.orElseGet(() -> createNewUser(userId, normalizedEmail, normalizedFirstName, normalizedLastName));

        boolean updated = isNewUser;
        updated |= setIfPresentAndChanged(user::getEmail, user::setEmail, normalizedEmail);
        // firstName and lastName are only set on user creation (from Keycloak initial values)
        // After that, they are managed independently in the database and not synced with Keycloak

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime cutoff = now.minus(LAST_ACTIVITY_UPDATE_THRESHOLD);

        if (user.getLastActivityAt() == null || user.getLastActivityAt().isBefore(cutoff)) {
            user.setLastActivityAt(now);
            updated = true;
        }

        if (updated) {
            user = userRepository.save(user);
        }

        assignApplicantRoleIfEmpty(user);
        return user;
    }

    /**
     * Updates the user's first and last name in the local database only.
     * Names are stored independently from Keycloak and can be changed by the user.
     *
     * @param userId    the Keycloak user ID
     * @param firstName the new first name
     * @param lastName  the new last name
     */
    @Transactional
    public void updateNames(String userId, String firstName, String lastName) {
        User user = userRepository.findById(UUID.fromString(userId)).orElseThrow(() -> EntityNotFoundException.forId("User", userId));

        String normalizedFirstName = StringUtil.normalize(firstName, false);
        String normalizedLastName = StringUtil.normalize(lastName, false);

        if (normalizedFirstName != null && !normalizedFirstName.isBlank()) {
            user.setFirstName(normalizedFirstName);
        }
        if (normalizedLastName != null && !normalizedLastName.isBlank()) {
            user.setLastName(normalizedLastName);
        }

        userRepository.save(user);
    }

    /**
     * Retrieves all users that are eligible to be added to a research group.
     *
     * <p>The result excludes any users who are already associated with a research group and
     * excludes users with administrative privileges. Each returned entry is converted to a
     * UserShortDTO to provide a concise representation suitable for selection or display
     * in UI components.</p>
     *
     * <p>Uses a two-query approach to avoid pagination issues with JOIN FETCH:
     * 1. First query fetches paginated user IDs
     * 2. Second query fetches full user data with eagerly loaded collections</p>
     *
     * @param pageDTO           pagination parameters including page number and size
     * @param searchQuery       an optional search query to filter users by name or email
     * @return                  a paginated response of UserShortDTO instances representing non-admin users
     *                          who are not currently assigned to any research group
     */
    public PageResponseDTO<UserShortDTO> getAvailableUsersForResearchGroup(PageDTO pageDTO, String searchQuery) {
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize());
        String normalizedSearchQuery = StringUtil.normalizeSearchQuery(searchQuery);

        Page<UUID> userIdsPage = userRepository.findAvailableUserIdsForResearchGroup(normalizedSearchQuery, pageable);

        if (userIdsPage.isEmpty()) {
            return new PageResponseDTO<>(List.of(), 0L);
        }

        List<User> users = userRepository.findUsersWithRolesByIds(userIdsPage.getContent());
        List<UserShortDTO> userDTOs = users.stream().map(UserShortDTO::new).toList();

        return new PageResponseDTO<>(userDTOs, userIdsPage.getTotalElements());
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
