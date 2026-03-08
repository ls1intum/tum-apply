package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.KeycloakUserDTO;
import de.tum.cit.aet.usermanagement.dto.auth.OtpCompleteDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import jakarta.ws.rs.core.Response;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class KeycloakUserService {

    public record PagedResult<T>(List<T> content, long total) {}

    private final CurrentUserService currentUserService;
    private final Keycloak keycloak;
    private final String realm;
    private final UserRepository userRepository;
    private static final int SAFETY_MAX = 1000;

    public KeycloakUserService(
        UserRepository userRepository,
        @Value("${keycloak.url}") String url,
        @Value("${keycloak.realm}") String realm,
        @Value("${keycloak.admin.client-id}") String clientId,
        @Value("${keycloak.admin.client-secret}") String clientSecret,
        CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.realm = realm;
        this.keycloak = KeycloakBuilder.builder()
            .serverUrl(url)
            .realm(realm)
            .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
            .clientId(clientId)
            .clientSecret(clientSecret)
            .build();
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves Keycloak users that are eligible to be added to a research group.
     * Excludes users already assigned to any local research group.
     *
     * @param searchKey search key for Keycloak query
     * @param pageDTO local pagination parameters
     * @return paginated list of available Keycloak users and the total amount before pagination
     */
    public PagedResult<KeycloakUserDTO> getAvailableUsersForResearchGroup(String searchKey, PageDTO pageDTO) {
        List<KeycloakUserDTO> availableUsers = filterOutAssignedUsers(searchTumUsers(searchKey, true));
        return new PagedResult<>(paginate(pageDTO, availableUsers), availableUsers.size());
    }

    /**
     * Finds a Keycloak user by university ID (LDAP_ID), case-insensitive.
     *
     * @param universityId university ID to search for
     * @return matching Keycloak user if present
     */
    public Optional<KeycloakUserDTO> findUserByUniversityId(String universityId) {
        String normalizedUniversityId = StringUtil.normalize(universityId, false);
        if (normalizedUniversityId.isBlank()) {
            return Optional.empty();
        }

        return searchTumUsers(normalizedUniversityId, false)
            .stream()
            .filter(user -> user.universityId() != null && user.universityId().equalsIgnoreCase(normalizedUniversityId))
            .findFirst();
    }

    private List<KeycloakUserDTO> searchTumUsers(String searchKey, boolean excludeCurrentUser) {
        int firstResult = 0;
        int maxResults = SAFETY_MAX;
        List<UserRepresentation> users = keycloak.realm(realm).users().search(searchKey, firstResult, maxResults);
        if (users == null || users.isEmpty()) {
            return List.of();
        }

        return users
            .stream()
            .filter(KeycloakUserService::isLDAPUser)
            .filter(user -> !excludeCurrentUser || !isCurrentUser(user))
            .map(this::toKeycloakUserDTO)
            .toList();
    }

    private KeycloakUserDTO toKeycloakUserDTO(UserRepresentation user) {
        return new KeycloakUserDTO(
            UUID.fromString(user.getId()),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getAttributes().get("LDAP_ID").get(0)
        );
    }

    private List<KeycloakUserDTO> filterOutAssignedUsers(List<KeycloakUserDTO> users) {
        List<String> candidateUniversityIds = users
            .stream()
            .map(KeycloakUserDTO::universityId)
            .filter(universityId -> universityId != null && !universityId.isBlank())
            .map(String::toLowerCase)
            .distinct()
            .toList();

        if (candidateUniversityIds.isEmpty()) {
            return users;
        }

        Set<String> assignedUniversityIds = new HashSet<>(userRepository.findAssignedUniversityIdsIn(candidateUniversityIds));
        return users
            .stream()
            .filter(user -> {
                if (user.universityId() == null || user.universityId().isBlank()) {
                    return false;
                }
                return !assignedUniversityIds.contains(user.universityId().toLowerCase());
            })
            .toList();
    }

    private List<KeycloakUserDTO> paginate(PageDTO pageDTO, List<KeycloakUserDTO> users) {
        int start = pageDTO.pageNumber() * pageDTO.pageSize();
        if (start >= users.size()) {
            return List.of();
        }
        int end = Math.min(start + pageDTO.pageSize(), users.size());
        return users.subList(start, end);
    }

    private static boolean isLDAPUser(UserRepresentation user) {
        Map<String, List<String>> attributes = user.getAttributes();
        if (attributes == null) {
            return false;
        }
        List<String> values = attributes.get("LDAP_ID");
        return values != null && !values.isEmpty();
    }

    private boolean isCurrentUser(UserRepresentation user) {
        User currentUser = currentUserService.getUser();
        if (currentUser == null) {
            return false;
        }

        String currentUniversityId = currentUser.getUniversityId();
        if (currentUniversityId == null || currentUniversityId.isBlank()) {
            return false;
        }

        Map<String, List<String>> attributes = user.getAttributes();
        if (attributes == null) {
            return false;
        }
        List<String> ldapIds = attributes.get("LDAP_ID");
        if (ldapIds == null || ldapIds.isEmpty()) {
            return false;
        }

        return currentUniversityId.equalsIgnoreCase(ldapIds.get(0));
    }

    /**
     * Finds a Keycloak user ID by email (case-insensitive).
     *
     * @param email the email address to search for; must not be {@code null}
     * @return an {@link Optional} containing the user ID if a user with the given email exists; otherwise {@link Optional#empty()}
     */
    public Optional<String> findUserIdByEmail(String email) {
        List<UserRepresentation> res = keycloak.realm(realm).users().searchByEmail(email, true);
        if (res == null || res.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(res.getFirst().getId());
    }

    /**
     * Ensures a user exists in Keycloak for the given email (creates one if missing).
     * <p>
     * The created user is initialized with enabled=true and emailVerified=true.
     * If a concurrent creation happens and Keycloak returns HTTP 409 (conflict), this method performs a follow-up
     * lookup and returns the resulting user ID.
     *
     * @param body the OTP completion request containing email and optional profile information
     * @return the Keycloak user ID corresponding to the email
     * @throws IllegalStateException if user creation fails with an unexpected status code
     */
    public String ensureUser(OtpCompleteDTO body) {
        String normalizedEmail = StringUtil.normalize(body.email(), true);
        return findUserIdByEmail(normalizedEmail).orElseGet(() -> {
            UserRepresentation newUserRepresentation = new UserRepresentation();
            newUserRepresentation.setUsername(normalizedEmail);
            newUserRepresentation.setEmail(normalizedEmail);
            newUserRepresentation.setFirstName(StringUtil.normalize(body.profile() != null ? body.profile().firstName() : null, false));
            newUserRepresentation.setLastName(StringUtil.normalize(body.profile() != null ? body.profile().lastName() : null, false));
            newUserRepresentation.setEnabled(true);
            newUserRepresentation.setEmailVerified(true);

            try (Response resp = keycloak.realm(realm).users().create(newUserRepresentation)) {
                if (resp.getStatus() == 201 && resp.getLocation() != null) {
                    String path = resp.getLocation().getPath();
                    return path.substring(path.lastIndexOf('/') + 1);
                }
                // If created concurrently we might see 409; try lookup again
                if (resp.getStatus() == 409) {
                    return findUserIdByEmail(normalizedEmail).orElseThrow();
                }
                throw new IllegalStateException("Keycloak user create failed: status=" + resp.getStatus());
            }
        });
    }

    /**
     * Updates basic profile fields (firstName and lastName) of a Keycloak user.
     * Blank or null inputs are ignored; existing values remain unchanged in that case.
     * Names are normalized before being persisted.
     * Only updates fields if the new value is non-blank and different from the current value.
     *
     * @param userId    Keycloak user ID
     * @param firstName optional first name; ignored if null or blank
     * @param lastName  optional last name; ignored if null or blank
     * @return {@code true} if any field was updated, {@code false} otherwise
     */
    public boolean updateProfile(String userId, String firstName, String lastName) {
        UserResource userResource = keycloak.realm(realm).users().get(userId);
        UserRepresentation userRepresentation = userResource.toRepresentation();
        if (userRepresentation == null) {
            return false;
        }
        boolean updated = false;

        String normalizedFirstName = StringUtil.normalize(firstName, false);
        if (!normalizedFirstName.isBlank() && !normalizedFirstName.equals(userRepresentation.getFirstName())) {
            userRepresentation.setFirstName(normalizedFirstName);
            updated = true;
        }

        String normalizedLastName = StringUtil.normalize(lastName, false);
        if (!normalizedLastName.isBlank() && !normalizedLastName.equals(userRepresentation.getLastName())) {
            userRepresentation.setLastName(normalizedLastName);
            updated = true;
        }

        if (updated) {
            userResource.update(userRepresentation);
        }
        return updated;
    }

    /**
     * Sets the password for a Keycloak user.
     *
     * @param userId      the Keycloak user ID
     * @param newPassword the new password (must be non-blank)
     * @return {@code true} if the password was updated, {@code false} if input invalid or user not found
     */
    public boolean setPassword(String userId, String newPassword) {
        String trimmedPassword = newPassword.trim();
        if (userId == null || trimmedPassword.isBlank()) {
            return false;
        }
        UserResource userResource = keycloak.realm(realm).users().get(userId);
        if (userResource == null) {
            return false;
        }
        try {
            CredentialRepresentation cred = new CredentialRepresentation();
            cred.setType(CredentialRepresentation.PASSWORD);
            cred.setValue(trimmedPassword);
            cred.setTemporary(false);

            userResource.resetPassword(cred);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Invalidates all active sessions of the specified user via backchannel logout.
     *
     * @param userId the Keycloak user ID; must not be {@code null}
     */
    public void logout(String userId) {
        keycloak.realm(realm).users().get(userId).logout();
    }
}
