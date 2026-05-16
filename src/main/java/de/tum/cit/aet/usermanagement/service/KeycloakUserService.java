package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.dto.KeycloakUserDTO;
import de.tum.cit.aet.usermanagement.dto.auth.OtpCompleteDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import jakarta.ws.rs.core.Response;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
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

/**
 * Service for interacting with the Keycloak admin API and merging
 * Keycloak (LDAP/TUM) users with locally registered users.
 */
@Service
public class KeycloakUserService {

    public record PagedResult<T>(List<T> content, long total) {}

    private final CurrentUserService currentUserService;
    private final Keycloak tumKeycloak;
    private final Keycloak externalKeycloak;
    private final String keycloakUrl;
    private final String tumRealm;
    private final String externalRealm;
    private final UserRepository userRepository;
    private static final int SAFETY_MAX = 1000;

    public KeycloakUserService(
        UserRepository userRepository,
        @Value("${keycloak.url}") String url,
        @Value("${keycloak.tum-login-realm}") String tumRealm,
        @Value("${keycloak.external-login-realm}") String externalRealm,
        @Value("${keycloak.admin.tum.client-id}") String tumClientId,
        @Value("${keycloak.admin.tum.client-secret}") String tumClientSecret,
        @Value("${keycloak.admin.external.client-id}") String externalClientId,
        @Value("${keycloak.admin.external.client-secret}") String externalClientSecret,
        CurrentUserService currentUserService
    ) {
        this.userRepository = userRepository;
        this.keycloakUrl = url;
        this.tumRealm = tumRealm;
        this.externalRealm = externalRealm;
        this.tumKeycloak = buildAdminClient(url, tumRealm, tumClientId, tumClientSecret);
        this.externalKeycloak = buildAdminClient(url, externalRealm, externalClientId, externalClientSecret);
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves users eligible to be added to a research group by merging
     * Keycloak LDAP users with locally registered (non-TUM) users.
     *
     * @param searchKey search key for user query
     * @param pageDTO   pagination parameters
     * @return paginated list of available users and the total count before pagination
     */
    public PagedResult<KeycloakUserDTO> getAvailableUsersForResearchGroup(String searchKey, PageDTO pageDTO) {
        // 1) Search Keycloak for TUM/LDAP users
        List<KeycloakUserDTO> keycloakUsers = searchTumUsers(searchKey, true);

        // 2) Search local DB for available users (including non-TUM)
        List<KeycloakUserDTO> localUsers = userRepository
            .searchAvailableUsersForResearchGroup(searchKey)
            .stream()
            .filter(user -> !currentUserService.isCurrentUser(user.getUserId()))
            .map(KeycloakUserDTO::fromUser)
            .toList();

        // 3) Merge and deduplicate (Keycloak results take priority)
        List<KeycloakUserDTO> merged = mergeAndDeduplicate(keycloakUsers, localUsers);

        // 4) Filter out users already assigned to a research group
        List<KeycloakUserDTO> availableUsers = filterOutAssignedUsers(merged);

        // 5) Paginate
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

    /**
     * Searches Keycloak for LDAP-backed (TUM) users matching the given search key.
     */
    private List<KeycloakUserDTO> searchTumUsers(String searchKey, boolean excludeCurrentUser) {
        List<UserRepresentation> users = tumKeycloak.realm(tumRealm).users().search(searchKey, 0, SAFETY_MAX);
        if (users == null || users.isEmpty()) {
            return List.of();
        }

        return users
            .stream()
            .filter(KeycloakUserService::isLDAPUser)
            .filter(user -> !excludeCurrentUser || !isCurrentLdapUser(user))
            .map(KeycloakUserDTO::fromLdapUser)
            .toList();
    }

    /**
     * Checks whether the given LDAP user matches the currently authenticated user
     * by comparing the LDAP_ID attribute against the current user's universityId.
     */
    private boolean isCurrentLdapUser(UserRepresentation user) {
        String currentUniversityId = currentUserService.getUser().getUniversityId();
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

        return currentUniversityId.equalsIgnoreCase(ldapIds.getFirst());
    }

    /**
     * Merges Keycloak and local user lists, deduplicating by userId.
     * Keycloak entries take priority since they contain richer LDAP data.
     */
    private List<KeycloakUserDTO> mergeAndDeduplicate(List<KeycloakUserDTO> keycloakUsers, List<KeycloakUserDTO> localUsers) {
        Map<UUID, KeycloakUserDTO> merged = new LinkedHashMap<>();
        for (KeycloakUserDTO user : keycloakUsers) {
            merged.put(user.id(), user);
        }
        for (KeycloakUserDTO user : localUsers) {
            merged.putIfAbsent(user.id(), user);
        }
        return new ArrayList<>(merged.values());
    }

    /**
     * Filters out users that are already assigned to a research group.
     * Uses universityId for TUM users and userId for non-TUM users.
     */
    private List<KeycloakUserDTO> filterOutAssignedUsers(List<KeycloakUserDTO> users) {
        // 1) Collect and check universityId-based assignments (TUM users)
        List<String> candidateUniversityIds = users
            .stream()
            .map(KeycloakUserDTO::universityId)
            .filter(universityId -> universityId != null && !universityId.isBlank())
            .map(String::toLowerCase)
            .distinct()
            .toList();

        Set<String> assignedUniversityIds = candidateUniversityIds.isEmpty()
            ? Set.of()
            : new HashSet<>(userRepository.findAssignedUniversityIdsIn(candidateUniversityIds));

        // 2) Collect and check userId-based assignments (non-TUM users)
        List<UUID> candidateUserIds = users
            .stream()
            .filter(user -> user.universityId() == null || user.universityId().isBlank())
            .map(KeycloakUserDTO::id)
            .distinct()
            .toList();

        Set<UUID> assignedUserIds = candidateUserIds.isEmpty()
            ? Set.of()
            : new HashSet<>(userRepository.findAssignedUserIdsIn(candidateUserIds));

        // 3) Filter out assigned users
        return users
            .stream()
            .filter(user -> {
                if (user.universityId() != null && !user.universityId().isBlank()) {
                    return !assignedUniversityIds.contains(user.universityId().toLowerCase());
                }
                return !assignedUserIds.contains(user.id());
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

    /**
     * Finds a Keycloak user ID by email (case-insensitive).
     *
     * @param email the email address to search for; must not be {@code null}
     * @return an {@link Optional} containing the user ID if a user with the given email exists; otherwise {@link Optional#empty()}
     */
    public Optional<String> findUserIdByEmail(String email) {
        List<UserRepresentation> res = externalKeycloak.realm(externalRealm).users().searchByEmail(email, true);
        if (res == null || res.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(res.getFirst().getId());
    }

    /**
     * Fetches a user from Keycloak by their UUID.
     *
     * @param userId the Keycloak user UUID
     * @return the Keycloak user as a {@link KeycloakUserDTO}, or empty if no such user exists
     */
    public Optional<KeycloakUserDTO> findKeycloakUserById(UUID userId) {
        try {
            UserRepresentation rep = keycloak.realm(realm).users().get(userId.toString()).toRepresentation();
            if (rep == null) {
                return Optional.empty();
            }
            String universityId = null;
            Map<String, List<String>> attributes = rep.getAttributes();
            if (attributes != null) {
                List<String> ldapIds = attributes.get("LDAP_ID");
                if (ldapIds != null && !ldapIds.isEmpty()) {
                    universityId = ldapIds.getFirst();
                }
            }
            return Optional.of(
                new KeycloakUserDTO(
                    UUID.fromString(rep.getId()),
                    rep.getUsername(),
                    rep.getFirstName(),
                    rep.getLastName(),
                    rep.getEmail(),
                    universityId
                )
            );
        } catch (jakarta.ws.rs.NotFoundException e) {
            return Optional.empty();
        }
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

            try (Response resp = externalKeycloak.realm(externalRealm).users().create(newUserRepresentation)) {
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
     * Creates a Keycloak user with the given identity fields and sets the initial password.
     * If a user with the same email already exists, the existing Keycloak user id is returned
     * and the password is updated. Used by the admin "Manage Users" create flow.
     *
     * @param email     the user's email (also used as the Keycloak username)
     * @param firstName the user's given name
     * @param lastName  the user's family name
     * @param password  the initial password (must be non-blank)
     * @return the Keycloak user UUID
     * @throws IllegalStateException if Keycloak user creation fails
     */
    public UUID createUserWithPassword(String email, String firstName, String lastName, String password) {
        String normalizedEmail = StringUtil.normalize(email, true);
        String keycloakUserId = findUserIdByEmail(normalizedEmail).orElseGet(() -> {
            UserRepresentation newUser = new UserRepresentation();
            newUser.setUsername(normalizedEmail);
            newUser.setEmail(normalizedEmail);
            newUser.setFirstName(StringUtil.normalize(firstName, false));
            newUser.setLastName(StringUtil.normalize(lastName, false));
            newUser.setEnabled(true);
            newUser.setEmailVerified(true);

            try (Response resp = keycloak.realm(realm).users().create(newUser)) {
                if (resp.getStatus() == 201 && resp.getLocation() != null) {
                    String path = resp.getLocation().getPath();
                    return path.substring(path.lastIndexOf('/') + 1);
                }
                if (resp.getStatus() == 409) {
                    return findUserIdByEmail(normalizedEmail).orElseThrow();
                }
                throw new IllegalStateException("Keycloak user create failed: status=" + resp.getStatus());
            }
        });
        boolean passwordSet = setPassword(keycloakUserId, password);
        if (!passwordSet) {
            throw new IllegalStateException("Keycloak password set failed for userId=" + keycloakUserId);
        }
        return UUID.fromString(keycloakUserId);
    }

    /**
     * Sets the password for a Keycloak user.
     *
     * @param userId      the Keycloak user ID
     * @param newPassword the new password (must be non-blank)
     * @param issuer      the issuer URL to determine the realm context; if {@code null} or unrecognized, defaults to external realm
     * @return {@code true} if the password was updated, {@code false} if input invalid or user not found
     */
    public boolean setPassword(String userId, String newPassword, URL issuer) {
        String trimmedPassword = newPassword.trim();
        if (userId == null || trimmedPassword.isBlank()) {
            return false;
        }
        RealmAdminContext adminContext = resolveAdminContext(issuer);
        UserResource userResource = adminContext.keycloak().realm(adminContext.realm()).users().get(userId);
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
     * Lists Keycloak credentials for the user in the realm that issued the current token.
     *
     * @param userId the Keycloak user ID
     * @param issuer the token issuer used to select the realm
     * @return credentials registered for the user, or an empty list when the user cannot be resolved
     */
    public List<CredentialRepresentation> getCredentials(String userId, URL issuer) {
        if (userId == null || userId.isBlank()) {
            return List.of();
        }
        RealmAdminContext adminContext = resolveAdminContext(issuer);
        List<CredentialRepresentation> credentials = adminContext.keycloak().realm(adminContext.realm()).users().get(userId).credentials();
        return credentials != null ? credentials : List.of();
    }

    /**
     * Removes one Keycloak credential for the user in the realm that issued the current token.
     *
     * @param userId       the Keycloak user ID
     * @param issuer       the token issuer used to select the realm
     * @param credentialId the Keycloak credential ID to remove
     */
    public void removeCredential(String userId, URL issuer, String credentialId) {
        if (userId == null || userId.isBlank() || credentialId == null || credentialId.isBlank()) {
            return;
        }
        RealmAdminContext adminContext = resolveAdminContext(issuer);
        adminContext.keycloak().realm(adminContext.realm()).users().get(userId).removeCredential(credentialId);
    }

    /**
     * Invalidates all active sessions of the specified user via backchannel logout.
     *
     * @param userId the Keycloak user ID; must not be {@code null}
     */
    public void logout(String userId) {
        externalKeycloak.realm(externalRealm).users().get(userId).logout();
    }

    /**
     * Deletes a user from Keycloak. Idempotent — returns silently if the user does not exist.
     *
     * @param userId the Keycloak user UUID
     */
    public void deleteUser(UUID userId) {
        try {
            externalKeycloak.realm(externalRealm).users().get(userId.toString()).remove();
        } catch (jakarta.ws.rs.NotFoundException e) {
            // Idempotent delete: a missing Keycloak user is fine — local DB cleanup still proceeds.
        }
    }

    private Keycloak buildAdminClient(String url, String realm, String clientId, String clientSecret) {
        return KeycloakBuilder.builder()
            .serverUrl(url)
            .realm(realm)
            .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
            .clientId(clientId)
            .clientSecret(clientSecret)
            .build();
    }

    private RealmAdminContext resolveAdminContext(URL issuer) {
        if (issuer != null) {
            String issuerValue = issuer.toString();
            if (realmIssuer(tumRealm).equals(issuerValue)) {
                return new RealmAdminContext(tumKeycloak, tumRealm);
            }
            if (realmIssuer(externalRealm).equals(issuerValue)) {
                return new RealmAdminContext(externalKeycloak, externalRealm);
            }
        }
        return new RealmAdminContext(externalKeycloak, externalRealm);
    }

    private String realmIssuer(String realm) {
        return String.format(
            "%s/realms/%s",
            keycloakUrl.endsWith("/") ? keycloakUrl.substring(0, keycloakUrl.length() - 1) : keycloakUrl,
            realm
        );
    }

    private record RealmAdminContext(Keycloak keycloak, String realm) {}
}
