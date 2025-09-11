package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.auth.OtpCompleteDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;

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
     * Creates a new local user and assigns the default applicant role if not present.
     * If a user with the same email already exists, no action is taken.
     *
     * @param keycloakUserId the Keycloak user ID to associate with the new user
     * @param body           OTP request with email and optional profile
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
            User savedUser = userRepository.save(newUser);
            ensureApplicantRole(savedUser);
        }
    }

    /**
     * Upserts a user from identity claims and optionally assigns the default applicant role.
     * If the user exists, updates basic fields; if not, creates a new user.
     * Returns the managed entity.
     */
    @Transactional
    public User upsertFromClaims(UUID userId, String email, String firstName, String lastName) {
        String normalizedEmail = StringUtil.normalize(email, true);
        String normalizedFirstName = StringUtil.normalize(firstName, false);
        String normalizedLastName = StringUtil.normalize(lastName, false);

        User user = userRepository.findWithResearchGroupRolesByUserId(userId).orElse(null);
        boolean isNewUser = false;
        if (user == null) {
            user = new User();
            user.setUserId(userId);
            user.setEmail(normalizedEmail);
            user.setFirstName(normalizedFirstName);
            user.setLastName(normalizedLastName);
            isNewUser = true;
        }

        boolean userUpdated = false;
        if (!normalizedEmail.isBlank() && !normalizedEmail.equals(user.getEmail())) {
            user.setEmail(normalizedEmail);
            userUpdated = true;
        }
        if (!normalizedFirstName.isBlank() && !normalizedFirstName.equals(user.getFirstName())) {
            user.setFirstName(normalizedFirstName);
            userUpdated = true;
        }
        if (!normalizedLastName.isBlank() && !normalizedLastName.equals(user.getLastName())) {
            user.setLastName(normalizedLastName);
            userUpdated = true;
        }

        if (isNewUser || userUpdated) {
            user = userRepository.save(user);
        }

        if (user.getResearchGroupRoles() == null || user.getResearchGroupRoles().isEmpty()) {
            ensureApplicantRole(user);
        }

        return user;
    }

    /**
     * Ensures that the user has at least the APPLICANT role.
     * Call this method only if the user has no roles assigned.
     *
     * @param user the user entity for which to ensure the applicant role
     */
    private void ensureApplicantRole(User user) {
        UserResearchGroupRole defaultRole = new UserResearchGroupRole();
        defaultRole.setUser(user);
        defaultRole.setRole(UserRole.APPLICANT);
        userResearchGroupRoleRepository.save(defaultRole);
    }
}
