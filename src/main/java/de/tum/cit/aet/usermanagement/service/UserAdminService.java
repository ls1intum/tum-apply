package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.retention.UserRetentionService;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.util.PageUtil;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.AdminUserDetailDTO;
import de.tum.cit.aet.usermanagement.dto.AdminUserOverviewDTO;
import de.tum.cit.aet.usermanagement.dto.CreateUserDTO;
import de.tum.cit.aet.usermanagement.dto.ImportUserDTO;
import de.tum.cit.aet.usermanagement.dto.KeycloakUserDTO;
import de.tum.cit.aet.usermanagement.dto.UpdateUserDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Orchestrates Keycloak and local-DB user management for admins.
 * Provides list, detail, create, import, update, and delete operations
 * used by the "Manage Users" admin page.
 */
@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;
    private final KeycloakUserService keycloakUserService;
    private final UserService userService;
    private final UserRetentionService userRetentionService;
    private final CurrentUserService currentUserService;

    /**
     * Returns a paginated, filterable, searchable list of users for the admin "Manage Users" view.
     *
     * @param pageDTO          pagination configuration
     * @param sortDTO          sorting configuration
     * @param roles            optional filter on roles; null/empty means no filter
     * @param researchGroupIds optional filter on research groups; null/empty means no filter
     * @param searchQuery      optional free-text search query (matched against name, email, universityId)
     * @return a page of admin user overview rows
     */
    public Page<AdminUserOverviewDTO> getAllUsersForAdmin(
        PageDTO pageDTO,
        SortDTO sortDTO,
        List<UserRole> roles,
        List<UUID> researchGroupIds,
        String searchQuery
    ) {
        Pageable pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.USERS_ADMIN, true);
        return userRepository.findAllUsersForAdmin(
            (roles == null || roles.isEmpty()) ? null : roles,
            (researchGroupIds == null || researchGroupIds.isEmpty()) ? null : researchGroupIds,
            StringUtil.normalizeSearchQuery(searchQuery),
            pageable
        );
    }

    /**
     * Returns the full admin-scoped detail view for a single user.
     *
     * @param userId the user ID to look up
     * @return the populated detail DTO
     * @throws EntityNotFoundException if no user exists with the given ID
     */
    public AdminUserDetailDTO getUserDetail(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        UserRole primaryRole = user.getResearchGroupRoles() == null
            ? null
            : user
                .getResearchGroupRoles()
                .stream()
                .map(r -> r.getRole())
                .max(Comparator.comparingInt(UserAdminService::priority))
                .orElse(null);
        UUID rgId = user.getResearchGroup() == null ? null : user.getResearchGroup().getResearchGroupId();
        String rgName = user.getResearchGroup() == null ? null : user.getResearchGroup().getName();
        return new AdminUserDetailDTO(
            user.getUserId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getAvatar(),
            user.getUniversityId(),
            primaryRole,
            rgId,
            rgName,
            user.getPhoneNumber(),
            user.getGender(),
            user.getNationality(),
            user.getBirthday(),
            user.getWebsite(),
            user.getLinkedinUrl(),
            user.getSelectedLanguage(),
            user.isAiFeaturesEnabled(),
            user.getCreatedAt(),
            user.getLastActivityAt()
        );
    }

    /**
     * Creates a new Keycloak user with the given password, then provisions a matching
     * local DB row and applies any optional DB-only fields. Keycloak is contacted first
     * so that an upstream failure aborts the flow before any DB write.
     *
     * @param dto the create-user payload
     * @return the new user's UUID
     */
    @Transactional
    public UUID create(CreateUserDTO dto) {
        // 1) Keycloak first — failure aborts before any DB write.
        UUID userId = keycloakUserService.createUserWithPassword(dto.email(), dto.firstName(), dto.lastName(), dto.password());
        // 2) Local DB upsert (creates user + assigns APPLICANT role if missing).
        userService.upsertUser(userId.toString(), dto.email(), dto.firstName(), dto.lastName());
        // 3) Apply DB-only optional fields.
        applyOptionalCreateFields(userId, dto);
        return userId;
    }

    /**
     * Imports an existing Keycloak user into the local DB by their Keycloak UUID.
     *
     * @param dto the import payload containing the Keycloak user ID
     * @return the imported user's UUID
     * @throws EntityNotFoundException if no Keycloak user exists with the given ID
     */
    @Transactional
    public UUID importFromKeycloak(ImportUserDTO dto) {
        KeycloakUserDTO kcUser = keycloakUserService
            .findKeycloakUserById(dto.keycloakUserId())
            .orElseThrow(() -> EntityNotFoundException.forId("KeycloakUser", dto.keycloakUserId()));
        userService.upsertUser(kcUser.id().toString(), kcUser.email(), kcUser.firstName(), kcUser.lastName());
        return kcUser.id();
    }

    /**
     * Updates DB-only fields of an existing user. Email and userId are not mutable here;
     * password updates go through a separate endpoint.
     *
     * @param userId the user ID to update
     * @param dto    the update payload (any null field is left untouched)
     * @throws EntityNotFoundException if no user exists with the given ID
     */
    @Transactional
    public void update(UUID userId, UpdateUserDTO dto) {
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        if (dto.firstName() != null) {
            user.setFirstName(dto.firstName());
        }
        if (dto.lastName() != null) {
            user.setLastName(dto.lastName());
        }
        if (dto.universityId() != null) {
            user.setUniversityId(dto.universityId());
        }
        if (dto.phoneNumber() != null) {
            user.setPhoneNumber(dto.phoneNumber());
        }
        if (dto.gender() != null) {
            user.setGender(dto.gender());
        }
        if (dto.nationality() != null) {
            user.setNationality(dto.nationality());
        }
        if (dto.birthday() != null) {
            user.setBirthday(dto.birthday());
        }
        if (dto.website() != null) {
            user.setWebsite(dto.website());
        }
        if (dto.linkedinUrl() != null) {
            user.setLinkedinUrl(dto.linkedinUrl());
        }
        if (dto.selectedLanguage() != null) {
            user.setSelectedLanguage(dto.selectedLanguage());
        }
        if (dto.aiFeaturesEnabled() != null) {
            user.setAiFeaturesEnabled(dto.aiFeaturesEnabled());
        }
        if (dto.avatar() != null) {
            user.setAvatar(dto.avatar());
        }
        userRepository.save(user);
    }

    /**
     * Deletes a user from Keycloak and anonymises their local-DB references.
     * An admin cannot delete their own account.
     *
     * @param userId the user ID to delete
     * @throws OperationNotAllowedException if the caller targets their own account
     */
    @Transactional
    public void delete(UUID userId) {
        UUID currentUserId = currentUserService.getUserId();
        if (userId.equals(currentUserId)) {
            throw new OperationNotAllowedException("Admins cannot delete their own account.");
        }
        keycloakUserService.deleteUser(userId);
        userRetentionService.deleteUserByAdmin(userId);
    }

    /**
     * Applies the optional DB-only fields supplied during user creation.
     * Loads the freshly upserted user and writes only non-null values.
     *
     * @param userId the newly created user's ID
     * @param dto    the create payload (optional fields read here)
     */
    private void applyOptionalCreateFields(UUID userId, CreateUserDTO dto) {
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        boolean changed = false;
        if (dto.universityId() != null) {
            user.setUniversityId(dto.universityId());
            changed = true;
        }
        if (dto.phoneNumber() != null) {
            user.setPhoneNumber(dto.phoneNumber());
            changed = true;
        }
        if (dto.gender() != null) {
            user.setGender(dto.gender());
            changed = true;
        }
        if (dto.nationality() != null) {
            user.setNationality(dto.nationality());
            changed = true;
        }
        if (dto.birthday() != null) {
            user.setBirthday(dto.birthday());
            changed = true;
        }
        if (dto.website() != null) {
            user.setWebsite(dto.website());
            changed = true;
        }
        if (dto.linkedinUrl() != null) {
            user.setLinkedinUrl(dto.linkedinUrl());
            changed = true;
        }
        if (dto.selectedLanguage() != null) {
            user.setSelectedLanguage(dto.selectedLanguage());
            changed = true;
        }
        if (changed) {
            userRepository.save(user);
        }
    }

    /**
     * Ranks roles so the highest-privilege role is selected as the user's primary role.
     *
     * @param role the role to rank
     * @return integer priority (higher means more privileged)
     */
    private static int priority(UserRole role) {
        return switch (role) {
            case ADMIN -> 3;
            case PROFESSOR -> 2;
            case EMPLOYEE -> 1;
            case APPLICANT -> 0;
        };
    }
}
