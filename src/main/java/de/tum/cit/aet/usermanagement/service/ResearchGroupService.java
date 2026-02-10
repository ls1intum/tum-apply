package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.AlreadyMemberOfResearchGroupException;
import de.tum.cit.aet.core.exception.BadRequestException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.util.PageUtil;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.dto.ResearchGroupEmailContext;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.EmailTemplateService;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.*;
import de.tum.cit.aet.usermanagement.repository.DepartmentRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing research groups.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResearchGroupService {

    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final ResearchGroupRepository researchGroupRepository;
    private final DepartmentRepository departmentRepository;

    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final AsyncEmailSender emailSender;
    private final EmailTemplateService emailTemplateService;

    @Value("${aet.contact-email:tum-apply.aet@xcit.tum.de}")
    private String supportEmail;

    @Value("${aet.environment:}")
    private String environmentName;

    /**
     * Get all members of the current user's research group.
     *
     * @param pageDTO pagination information
     * @return paginated list of research group members
     */
    public PageResponseDTO<UserShortDTO> getResearchGroupMembers(PageDTO pageDTO) {
        // Get the current user's research group ID
        UUID researchGroupId = currentUserService.getResearchGroupIdIfMember();

        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize());

        // First query: Get paginated user IDs to avoid N+1 query problem
        Page<UUID> userIdsPage = userRepository.findUserIdsByResearchGroupId(researchGroupId, pageable);

        if (userIdsPage.isEmpty()) {
            return new PageResponseDTO<>(List.of(), 0L);
        }

        // Second query: Fetch full user data with collections for the paginated IDs
        UUID currentUserId = currentUserService.getUserId();
        List<User> members = userRepository.findUsersWithRolesByIdsForResearchGroup(userIdsPage.getContent(), currentUserId);

        return new PageResponseDTO<>(members.stream().map(UserShortDTO::new).toList(), userIdsPage.getTotalElements());
    }

    /**
     * Get all members of the research group by id.
     *
     * @param researchGroupId the ID of the research group
     * @param pageDTO pagination information
     * @return paginated list of research group members
     */
    public PageResponseDTO<UserShortDTO> getResearchGroupMembersById(UUID researchGroupId, PageDTO pageDTO) {
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize());

        // First query: Get paginated user IDs to avoid N+1 query problem
        Page<UUID> userIdsPage = userRepository.findUserIdsByResearchGroupId(researchGroupId, pageable);

        if (userIdsPage.isEmpty()) {
            return new PageResponseDTO<>(List.of(), 0L);
        }

        // Second query: Fetch full user data with collections for the paginated IDs
        // We pass null for currentUserId to request alphabetical ordering without pinning any user first
        List<User> members = userRepository.findUsersWithRolesByIdsForResearchGroup(userIdsPage.getContent(), null);

        return new PageResponseDTO<>(members.stream().map(UserShortDTO::new).toList(), userIdsPage.getTotalElements());
    }

    /**
     * Removes a member from the current user's research group.
     * This operation removes both associated roles and direct research group membership.
     * @param userId the ID of the user to remove from the research group
     * @throws EntityNotFoundException if the user is not found or not in the same research group
     */
    @Transactional
    public void removeMemberFromResearchGroup(UUID userId) {
        // Verify that the user exists and belongs to the same research group
        User userToRemove = userRepository
            .findWithResearchGroupRolesByUserId(userId)
            .orElseThrow(() -> EntityNotFoundException.forId("User", userId));

        // Ensure user belongs to the same research group or current user is admin
        if (
            !currentUserService.isAdmin() &&
            (userToRemove.getResearchGroup() == null ||
                !userToRemove.getResearchGroup().getResearchGroupId().equals(currentUserService.getResearchGroupIdIfMember()))
        ) {
            throw new AccessDeniedException("User is not a member of your research group");
        }

        // Prevent removing oneself (for now)
        UUID currentUserId = currentUserService.getUserId();
        if (userId.equals(currentUserId)) {
            throw new BadRequestException("Cannot remove yourself from the research group");
        }

        // Store the research group temporarily before removing it from the user
        ResearchGroup oldGroup = userToRemove.getResearchGroup();

        // Remove the direct research group membership
        userToRemove.setResearchGroup(null);
        userRepository.save(userToRemove);

        // Remove research group associations from user's roles
        if (oldGroup != null) {
            userResearchGroupRoleRepository
                .findByUserAndResearchGroup(userToRemove, oldGroup)
                .ifPresent(role -> {
                    role.setRole(UserRole.APPLICANT);
                    role.setResearchGroup(null);
                    userResearchGroupRoleRepository.save(role);
                });
        }
    }

    /**
     * Retrieves a research group by its ID.
     *
     * @param researchGroupId the ID of the research group to retrieve
     * @return the research group DTO
     */
    public ResearchGroupDTO getResearchGroup(UUID researchGroupId) {
        ResearchGroup researchGroup = researchGroupRepository.findByIdElseThrow(researchGroupId);
        return ResearchGroupDTO.getFromEntity(researchGroup);
    }

    /**
     * Retrieves the details of a research group by its ID.
     * Only users belonging to the research group can access its details.
     * @param researchGroupId the unique identifier of the research group
     * @return a {@link ResearchGroupLargeDTO} containing detailed information about
     *         the research group
     * @throws EntityNotFoundException if the research group is not found or user
     *                                 doesn't have access
     */

    public ResearchGroupLargeDTO getResearchGroupDetails(UUID researchGroupId) {
        currentUserService.isAdminOrMemberOf(researchGroupId);
        ResearchGroup researchGroup = researchGroupRepository
            .findById(researchGroupId)
            .orElseThrow(() -> EntityNotFoundException.forId("ResearchGroup", researchGroupId));

        return new ResearchGroupLargeDTO(
            researchGroup.getDescription(),
            researchGroup.getEmail(),
            researchGroup.getWebsite(),
            researchGroup.getStreet(),
            researchGroup.getPostalCode(),
            researchGroup.getCity()
        );
    }

    /**
     * Retrieves all research groups.
     *
     * @param pageDTO the pagination parameters
     * @return list of all research group DTOs
     */
    public PageResponseDTO<ResearchGroupDTO> getAllResearchGroups(PageDTO pageDTO) {
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize(), Sort.by(Sort.Direction.ASC, "name"));
        Page<ResearchGroup> page = researchGroupRepository.findAll(pageable);
        return new PageResponseDTO<>(page.get().map(ResearchGroupDTO::getFromEntity).toList(), page.getTotalElements());
    }

    /**
     * Updates an existing research group.
     *
     * @param researchGroupId the ID of the research group to update
     * @param researchGroupDTO the research group data to apply
     * @return the updated research group DTO
     */
    public ResearchGroupDTO updateResearchGroup(UUID researchGroupId, ResearchGroupDTO researchGroupDTO) {
        currentUserService.isAdminOrMemberOf(researchGroupId);
        ResearchGroup researchGroup = researchGroupRepository.findByIdElseThrow(researchGroupId);
        updateEntityFromDTO(researchGroup, researchGroupDTO);
        ResearchGroup updatedResearchGroup = researchGroupRepository.save(researchGroup);
        return ResearchGroupDTO.getFromEntity(updatedResearchGroup);
    }

    /**
     * Updates a ResearchGroup entity with values from the provided DTO.
     * Includes department updates when departmentId is provided.
     */
    private void updateEntityFromDTO(ResearchGroup entity, ResearchGroupDTO dto) {
        entity.setName(dto.name());
        entity.setAbbreviation(dto.abbreviation());
        entity.setHead(dto.head());
        entity.setEmail(dto.email());
        entity.setWebsite(dto.website());
        entity.setDescription(dto.description());
        entity.setStreet(dto.street());
        entity.setPostalCode(dto.postalCode());
        entity.setCity(dto.city());
        entity.setDefaultFieldOfStudies(dto.defaultFieldOfStudies());

        // Update department if departmentId is provided
        if (dto.departmentId() != null) {
            Department department = departmentRepository.findByIdElseThrow(dto.departmentId());
            entity.setDepartment(department);
        }
    }

    /**
     * Populates a ResearchGroup entity with values from a ResearchGroupRequestDTO.
     * Normalizes name, abbreviation, and universityId fields.
     * Fetches and sets the department from the provided departmentId.
     *
     * @param entity the research group entity to populate
     * @param request the request DTO containing the data
     * @throws EntityNotFoundException if the department does not exist
     */
    private void populateResearchGroupFromRequest(ResearchGroup entity, ResearchGroupRequestDTO request) {
        entity.setName(StringUtil.normalize(request.researchGroupName(), false));
        entity.setUniversityId(StringUtil.normalize(request.universityId(), false));
        entity.setHead(request.researchGroupHead());
        entity.setAbbreviation(StringUtil.normalize(request.abbreviation(), false));
        entity.setEmail(request.contactEmail());
        entity.setWebsite(request.website());

        // Fetch and set department
        Department department = departmentRepository.findByIdElseThrow(request.departmentId());
        entity.setDepartment(department);

        entity.setDescription(request.description());
        entity.setDefaultFieldOfStudies(request.defaultFieldOfStudies());
        entity.setStreet(request.street());
        entity.setPostalCode(request.postalCode());
        entity.setCity(request.city());
    }

    /**
     * Activates a DRAFT research group (admin only).
     * Changes the state from DRAFT to ACTIVE, allowing the research group to be used.
     * This operation can only be performed on research groups in DRAFT state.
     *
     * @param researchGroupId the unique identifier of the research group to activate
     * @return the activated research group with updated state
     * @throws EntityNotFoundException if the research group does not exist
     * @throws IllegalStateException if the research group is not in DRAFT state
     */
    @Transactional
    public ResearchGroup activateResearchGroup(UUID researchGroupId) {
        ResearchGroup group = researchGroupRepository.findByIdElseThrow(researchGroupId);
        if (group.getState() != ResearchGroupState.DRAFT && group.getState() != ResearchGroupState.DENIED) {
            throw new IllegalStateException("Only DRAFT or DENIED groups can be activated");
        }
        group.setState(ResearchGroupState.ACTIVE);
        ResearchGroup saved = researchGroupRepository.save(group);

        ensureEmailTemplates(saved);

        Set<UserResearchGroupRole> roles = userResearchGroupRoleRepository.findAllByResearchGroup(group);

        if (roles.isEmpty()) {
            log.warn("Expected at least 1 user for draft research group {}, found none", researchGroupId);
        }

        roles
            .stream()
            .filter(role -> role.getRole() == UserRole.APPLICANT)
            .forEach(role -> {
                role.setRole(UserRole.PROFESSOR);
                userResearchGroupRoleRepository.save(role);
            });

        userRepository.findByUniversityIdIgnoreCase(saved.getUniversityId()).ifPresent(prof -> sendApprovedResearchGroupEmail(prof, group));

        return saved;
    }

    /**
     * Denies a DRAFT research group (admin only).
     * Changes the state from DRAFT to DENIED, preventing the research group from being used.
     * This operation can only be performed on research groups in DRAFT state.
     *
     * @param researchGroupId the unique identifier of the research group to deny
     * @return the denied research group with updated state
     * @throws EntityNotFoundException if the research group does not exist
     * @throws IllegalStateException if the research group is not in DRAFT state
     */
    @Transactional
    public ResearchGroup denyResearchGroup(UUID researchGroupId) {
        ResearchGroup group = researchGroupRepository.findByIdElseThrow(researchGroupId);
        if (group.getState() != ResearchGroupState.DRAFT) {
            throw new IllegalStateException("Only DRAFT groups can be denied");
        }
        group.setState(ResearchGroupState.DENIED);
        return researchGroupRepository.save(group);
    }

    /**
     * Withdraws an ACTIVE research group back to DRAFT state (admin only).
     * Changes the state from ACTIVE to DRAFT, allowing the research group to be reviewed again.
     * This operation can only be performed on research groups in ACTIVE state.
     *
     * @param researchGroupId the unique identifier of the research group to withdraw
     * @return the withdrawn research group with updated state
     * @throws EntityNotFoundException if the research group does not exist
     * @throws IllegalStateException if the research group is not in ACTIVE state
     */
    @Transactional
    public ResearchGroup withdrawResearchGroup(UUID researchGroupId) {
        ResearchGroup group = researchGroupRepository.findByIdElseThrow(researchGroupId);
        if (group.getState() != ResearchGroupState.ACTIVE) {
            throw new IllegalStateException("Only ACTIVE groups can be withdrawn");
        }
        group.setState(ResearchGroupState.DRAFT);
        return researchGroupRepository.save(group);
    }

    /**
     * Retrieves research groups for admin view with filtering, sorting, and pagination.
     *
     * @param pageDTO the pagination parameters
     * @param filterDTO the filter parameters including status and search query
     * @param sortDTO the sorting parameters
     *
     * @return a paginated response containing research groups matching the criteria
     */
    public PageResponseDTO<ResearchGroupAdminDTO> getResearchGroupsForAdmin(
        PageDTO pageDTO,
        AdminResearchGroupFilterDTO filterDTO,
        SortDTO sortDTO
    ) {
        Pageable pageable = PageUtil.createPageRequest(pageDTO, sortDTO, PageUtil.ColumnMapping.RESEARCH_GROUPS_ADMIN, true);
        String normalizedSearchQuery = StringUtil.normalizeSearchQuery(filterDTO.getSearchQuery());

        Page<ResearchGroupAdminDTO> pageResult = researchGroupRepository.findAllForAdmin(
            filterDTO.getStatus(),
            normalizedSearchQuery,
            pageable
        );
        return new PageResponseDTO<>(pageResult.getContent(), pageResult.getTotalElements());
    }

    /**
     * Gets all DRAFT research groups for admin review.
     * Returns a paginated list of research groups that are waiting for admin approval.
     * Research groups are sorted by name in ascending order.
     *
     * @param pageDTO pagination information including page number and page size
     * @return paginated response containing DRAFT research groups and total count
     */
    public PageResponseDTO<ResearchGroupDTO> getDraftResearchGroups(PageDTO pageDTO) {
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize(), Sort.by(Sort.Direction.ASC, "name"));
        Page<ResearchGroup> page = researchGroupRepository.findByState(ResearchGroupState.DRAFT, pageable);
        return new PageResponseDTO<>(page.get().map(ResearchGroupDTO::getFromEntity).toList(), page.getTotalElements());
    }

    /**
     * Creates a research group request from a professor during onboarding.
     * The research group starts in DRAFT state and needs admin approval.
     * The professor is associated with the research group using the provided universityId and assigned the APPLICANT role.
     * An email notification is sent to support/administrators to review the new research group request.
     *
     * @param request the professor's research group request
     * @return the created research group in DRAFT state
     */
    @Transactional
    public ResearchGroup createProfessorResearchGroupRequest(ResearchGroupRequestDTO request) {
        User currentUser = currentUserService.getUser();

        if (currentUser.getResearchGroup() != null) {
            throw new AlreadyMemberOfResearchGroupException("User already belongs to a research group");
        }

        if (researchGroupRepository.existsByNameIgnoreCase(request.researchGroupName())) {
            throw new ResourceAlreadyExistsException("Research group with name '" + request.researchGroupName() + "' already exists");
        }

        ResearchGroup researchGroup = new ResearchGroup();
        populateResearchGroupFromRequest(researchGroup, request);
        researchGroup.setState(ResearchGroupState.DRAFT);

        ResearchGroup saved = researchGroupRepository.save(researchGroup);
        ensureEmailTemplates(saved);

        currentUser.setUniversityId(request.universityId());
        currentUser.setResearchGroup(saved);
        userRepository.save(currentUser);

        ensureUserRoleInGroup(currentUser, saved, UserRole.APPLICANT);

        notifySupportOfNewResearchGroupRequest(currentUser, saved);

        return saved;
    }

    /**
     * Creates a research group directly as ACTIVE state (admin only).
     * Associated with professor submitted in the request using universityId.
     *
     * @param request the research group creation request
     * @return the created research group in ACTIVE state
     */
    @Transactional
    public ResearchGroup createResearchGroupAsAdmin(ResearchGroupRequestDTO request) {
        if (researchGroupRepository.existsByNameIgnoreCase(request.researchGroupName())) {
            throw new ResourceAlreadyExistsException("Research group with name '" + request.researchGroupName() + "' already exists");
        }

        // Validate that the universityId belongs to a professor or eligible user
        User professor = userRepository
            .findByUniversityIdIgnoreCase(request.universityId())
            .orElseThrow(() -> new EntityNotFoundException("User with universityId '%s' not found".formatted(request.universityId())));

        // Check if user already has a research group
        if (professor.getResearchGroup() != null) {
            throw new AlreadyMemberOfResearchGroupException(
                "User with universityId '%s' is already a member of research group '%s'".formatted(
                    request.universityId(),
                    professor.getResearchGroup().getName()
                )
            );
        }

        ResearchGroup researchGroup = new ResearchGroup();
        populateResearchGroupFromRequest(researchGroup, request);
        researchGroup.setState(ResearchGroupState.ACTIVE);

        ResearchGroup saved;
        try {
            saved = researchGroupRepository.save(researchGroup);
        } catch (DataIntegrityViolationException e) {
            throw new ResourceAlreadyExistsException("Research group with name '" + request.researchGroupName() + "' already exists");
        }
        ensureEmailTemplates(saved);

        // Assign the professor to the research group
        professor.setResearchGroup(saved);
        userRepository.save(professor);

        // Update or create the PROFESSOR role
        ensureUserRoleInGroup(professor, saved, UserRole.PROFESSOR);

        return saved;
    }

    /**
     * Creates an employee research group access request during onboarding.
     * Sends an email to support/administrators with user information and professor name.
     * This is a temporary solution until the employee role is implemented.
     *
     * @param request the employee's research group request containing professor name
     */
    @Transactional
    public void createEmployeeResearchGroupRequest(EmployeeResearchGroupRequestDTO request) {
        User currentUser = currentUserService.getUser();

        String emailBody = String.format(
            """
            <html>
            <body>
                <h2>Employee Research Group Access Request</h2>
                <p>A user has requested access to a research group as an employee.</p>

                <h3>User Information:</h3>
                <ul>
                    <li><strong>Name:</strong> %s %s</li>
                    <li><strong>Email:</strong> %s</li>
                    <li><strong>User ID:</strong> %s</li>
                    <li><strong>University ID:</strong> %s</li>
                </ul>

                <h3>Professor Information:</h3>
                <ul>
                    <li><strong>Professor Name:</strong> %s</li>
                </ul>

                <p>Please assign this user to the appropriate research group.</p>
            </body>
            </html>
            """,
            currentUser.getFirstName() != null ? currentUser.getFirstName() : "N/A",
            currentUser.getLastName() != null ? currentUser.getLastName() : "N/A",
            currentUser.getEmail(),
            currentUser.getUserId(),
            currentUser.getUniversityId() != null ? currentUser.getUniversityId() : "Not provided",
            request.professorName()
        );

        User support = new User();
        support.setEmail(supportEmail);
        support.setSelectedLanguage(Language.ENGLISH.getCode());

        Email email = Email.builder()
            .to(support)
            .customSubject(buildSubjectWithEnvironment("Employee Research Group Access Request - " + currentUser.getEmail()))
            .customBody(emailBody)
            .sendAlways(true)
            .language(Language.ENGLISH)
            .content(currentUser)
            .build();

        emailSender.sendAsync(email);
    }

    /**
     * Adds multiple members to a research group.
     * <p>
     * For each provided Keycloak user, this method ensures they exist in the local database.
     * If a user does not exist locally, they are created. The user is then assigned to the specified
     * research group. An email notification is sent only if the user is newly created or if their
     * research group assignment has changed.
     *
     * @param keycloakUsers   A list of {@link KeycloakUserDTO} representing the users to be added.
     * @param researchGroupId The ID of the research group to which the members will be added.
     *                        If null, the current user's group is used (if they are a professor).
     */
    @Transactional
    public void addMembersToResearchGroup(List<KeycloakUserDTO> keycloakUsers, UUID researchGroupId) {
        UUID targetGroupId = researchGroupId != null ? researchGroupId : currentUserService.getResearchGroupIdIfMember();
        ResearchGroup researchGroup = researchGroupRepository.findByIdElseThrow(targetGroupId);

        for (KeycloakUserDTO keycloakUser : keycloakUsers) {
            if (keycloakUser.universityId() == null || keycloakUser.universityId().isBlank()) {
                throw new BadRequestException("User with ID '%s' does not have a valid universityId.".formatted(keycloakUser.id()));
            }
            Optional<User> result = userRepository.findByUniversityIdIgnoreCase(keycloakUser.universityId());
            User user;

            if (result.isPresent()) {
                user = result.get();
                if (user.getResearchGroup() != null) {
                    throw new AlreadyMemberOfResearchGroupException(
                        "User with universityId '%s' is already a member of a research group.".formatted(keycloakUser.universityId())
                    );
                }
            } else {
                user = new User();
                user.setUserId(keycloakUser.id());
                user.setEmail(keycloakUser.email());
                user.setFirstName(keycloakUser.firstName());
                user.setLastName(keycloakUser.lastName());
                user.setUniversityId(keycloakUser.universityId());
            }
            // Assign research group and save user
            user.setResearchGroup(researchGroup);
            if (user.getSelectedLanguage() == null) {
                user.setSelectedLanguage("en");
            }
            userRepository.save(user);

            // Ensure the user has a role in the research group
            ensureUserRoleInGroup(user, researchGroup, UserRole.EMPLOYEE);

            // Send notification email because the group was newly assigned or changed
            sendWelcomeToResearchGroupEmail(user, researchGroup);
        }
    }

    /**
     * Ensures a user has a specific role within a research group.
     * If the user already has a role in the group, it will be updated to the new role if different.
     * If the user has no role in the group, a new role mapping is created.
     *
     * @param user          The user to assign the role to.
     * @param researchGroup The research group for the role.
     * @param targetRole    The role to assign (e.g., PROFESSOR, APPLICANT).
     */
    private void ensureUserRoleInGroup(User user, ResearchGroup researchGroup, UserRole targetRole) {
        Optional<UserResearchGroupRole> existingRole = userResearchGroupRoleRepository.findByUserAndResearchGroup(user, researchGroup);

        if (existingRole.isPresent()) {
            if (existingRole.get().getRole() != targetRole) {
                existingRole.get().setRole(targetRole);
                userResearchGroupRoleRepository.save(existingRole.get());
            }
        } else {
            // Check if the user has a role without a research group (e.g. Applicant) and update it
            Optional<UserResearchGroupRole> roleWithoutGroup = userResearchGroupRoleRepository
                .findAllByUser(user)
                .stream()
                .filter(role -> role.getResearchGroup() == null)
                .findFirst();

            if (roleWithoutGroup.isPresent()) {
                UserResearchGroupRole role = roleWithoutGroup.get();
                role.setResearchGroup(researchGroup);
                role.setRole(targetRole);
                userResearchGroupRoleRepository.save(role);
            } else {
                UserResearchGroupRole newRole = new UserResearchGroupRole();
                newRole.setUser(user);
                newRole.setResearchGroup(researchGroup);
                newRole.setRole(targetRole);
                userResearchGroupRoleRepository.save(newRole);
            }
        }
    }

    private void notifySupportOfNewResearchGroupRequest(User user, ResearchGroup rg) {
        String emailBody = String.format(
            """
            <html>
            <body>
                <h2>New Research Group Request</h2>
                <p>A new research group has been requested and is awaiting approval.</p>

                <p>Please review and approve or deny this research group request in the admin panel.</p>
            </body>
            </html>
            """
        );

        User support = new User();
        support.setEmail(supportEmail);
        support.setSelectedLanguage(Language.ENGLISH.getCode());

        Email email = Email.builder()
            .to(support)
            .customSubject(buildSubjectWithEnvironment("New Research Group Request - " + rg.getName()))
            .customBody(emailBody)
            .sendAlways(true)
            .language(Language.ENGLISH)
            .build();

        emailSender.sendAsync(email);
    }

    /**
     * Sends a welcome email to a user who has been added to a new research group.
     *
     * @param user          The user who was added.
     * @param researchGroup The research group they were added to.
     */
    private void sendWelcomeToResearchGroupEmail(User user, ResearchGroup researchGroup) {
        Language language = user.getSelectedLanguage() != null ? Language.fromCode(user.getSelectedLanguage()) : Language.ENGLISH;

        Email email = Email.builder()
            .to(user)
            .language(language)
            .emailType(EmailType.RESEARCH_GROUP_MEMBER_ADDED)
            .content(new ResearchGroupEmailContext(user, researchGroup))
            .researchGroup(researchGroup)
            .build();

        emailSender.sendAsync(email);
    }

    /**
     * Sends a welcome email to the professor whose research group was approved.
     *
     * @param prof          The professor who was approved.
     * @param researchGroup The research group that was approved.
     */
    private void sendApprovedResearchGroupEmail(User prof, ResearchGroup researchGroup) {
        Language language = prof.getSelectedLanguage() != null ? Language.fromCode(prof.getSelectedLanguage()) : Language.ENGLISH;

        Email email = Email.builder()
            .to(prof)
            .language(language)
            .emailType(EmailType.RESEARCH_GROUP_APPROVED)
            .content(new ResearchGroupEmailContext(prof, researchGroup))
            .researchGroup(researchGroup)
            .build();

        emailSender.sendAsync(email);
    }

    /**
     * Ensures default email templates exist for the given research group.
     */
    private void ensureEmailTemplates(ResearchGroup researchGroup) {
        emailTemplateService.addMissingTemplates(researchGroup);
    }

    private String buildSubjectWithEnvironment(String subject) {
        if (environmentName == null || environmentName.isBlank()) {
            return subject;
        }
        return "[" + environmentName.toUpperCase() + "] " + subject;
    }
}
