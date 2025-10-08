package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.*;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    /**
     * Get all members of the current user's research group.
     *
     * @param pageDTO pagination information
     * @return paginated list of research group members
     */
    public PageResponseDTO<UserShortDTO> getResearchGroupMembers(PageDTO pageDTO) {
        // Get the current user's research group ID
        UUID researchGroupId = currentUserService.getResearchGroupIdIfProfessor();

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
     * Removes a member from the current user's research group.
     * This operation removes both associated roles and direct research group membership.
     * @param userId the ID of the user to remove from the research group
     * @throws EntityNotFoundException if the user is not found or not in the same research group
     */
    @Transactional
    public void removeMemberFromResearchGroup(UUID userId) {
        // Get the current user's research group ID for validation
        UUID currentUserResearchGroupId = currentUserService.getResearchGroupIdIfProfessor();

        // Verify that the user exists and belongs to the same research group
        User userToRemove = userRepository
            .findWithResearchGroupRolesByUserId(userId)
            .orElseThrow(() -> EntityNotFoundException.forId("User", userId));

        // Ensure user belongs to the same research group
        if (
            userToRemove.getResearchGroup() == null ||
            !userToRemove.getResearchGroup().getResearchGroupId().equals(currentUserResearchGroupId)
        ) {
            throw new AccessDeniedException("User is not a member of your research group");
        }

        // Prevent removing oneself (for now)
        UUID currentUserId = currentUserService.getUserId();
        if (userId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot remove yourself from the research group");
        }

        // Remove the direct research group membership
        userToRemove.setResearchGroup(null);
        userRepository.save(userToRemove);

        // Remove research group associations from user's roles
        userResearchGroupRoleRepository.removeResearchGroupFromUserRoles(userId);
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
        ResearchGroup researchGroup = researchGroupRepository.findByIdElseThrow(researchGroupId);
        updateEntityFromDTO(researchGroup, researchGroupDTO);
        ResearchGroup updatedResearchGroup = researchGroupRepository.save(researchGroup);
        return ResearchGroupDTO.getFromEntity(updatedResearchGroup);
    }

    /**
     * Updates a ResearchGroup entity with values from the provided DTO.
     */
    private void updateEntityFromDTO(ResearchGroup entity, ResearchGroupDTO dto) {
        entity.setName(dto.name());
        entity.setAbbreviation(dto.abbreviation());
        entity.setHead(dto.head());
        entity.setEmail(dto.email());
        entity.setWebsite(dto.website());
        entity.setSchool(dto.school());
        entity.setDescription(dto.description());
        entity.setStreet(dto.street());
        entity.setPostalCode(dto.postalCode());
        entity.setCity(dto.city());
        entity.setDefaultFieldOfStudies(dto.defaultFieldOfStudies());
    }

    /**
     * Provisions a target user (professor) into an existing research group.
     * - Caller must be ADMIN (enforced in controller).
     * - Group must already exist (manual creation).
     * - Uses dto.universityId as the user's TUM id (e.g., "ab12cde").
     * - Idempotent: if mapping exists with PROFESSOR, no-op.
     *
     * @param dto the research group + user information to provision
     * @return the research group after provisioning
     * @throws EntityNotFoundException if the user or the group does not exist
     */
    @Transactional
    public ResearchGroup provisionResearchGroup(ResearchGroupProvisionDTO dto) {
        User user = userRepository
            .findByUniversityIdIgnoreCase(dto.universityId())
            .orElseThrow(() -> new EntityNotFoundException("User with universityId '%s' not found".formatted(dto.universityId())));

        ResearchGroup group = researchGroupRepository
            .findById(dto.researchGroupId())
            .orElseThrow(() -> new EntityNotFoundException("ResearchGroup with id '%s' not found".formatted(dto.researchGroupId())));

        boolean userGroupChanged = false;
        if (user.getResearchGroup() == null || !group.getResearchGroupId().equals(user.getResearchGroup().getResearchGroupId())) {
            user.setResearchGroup(group);
            userRepository.save(user);
            userGroupChanged = true;
        }
        String roleOutcome = "unchanged";

        var existing = userResearchGroupRoleRepository.findByUserAndResearchGroup(user, group);
        if (existing.isEmpty()) {
            UserResearchGroupRole mapping = new UserResearchGroupRole();
            mapping.setUser(user);
            mapping.setResearchGroup(group);
            mapping.setRole(UserRole.PROFESSOR);
            userResearchGroupRoleRepository.save(mapping);
            roleOutcome = "created";
        } else if (existing.get().getRole() != UserRole.PROFESSOR) {
            existing.get().setRole(UserRole.PROFESSOR);
            userResearchGroupRoleRepository.save(existing.get());
            roleOutcome = "updated";
        }

        log.info(
            "AUDIT research-group.provision by={} targetUserId={} targetUniId={} groupId={} groupName={} userGroupChanged={} roleOutcome={}",
            currentUserService.getUserId(),
            user.getUserId(),
            dto.universityId(),
            group.getResearchGroupId(),
            group.getName(),
            userGroupChanged,
            roleOutcome
        );

        return group;
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
        if (group.getState() != ResearchGroupState.DRAFT) {
            throw new IllegalStateException("Only DRAFT groups can be activated");
        }
        group.setState(ResearchGroupState.ACTIVE);
        ResearchGroup saved = researchGroupRepository.save(group);

        log.info(
            "AUDIT research-group.activate by={} groupId={} name={}",
            currentUserService.getUserId(),
            researchGroupId,
            group.getName()
        );

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
        ResearchGroup saved = researchGroupRepository.save(group);

        log.info("AUDIT research-group.deny by={} groupId={} name={}", currentUserService.getUserId(), researchGroupId, group.getName());

        return saved;
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
     *
     * @param request the professor's research group request
     * @return the created research group in DRAFT state
     */
    @Transactional
    public ResearchGroup createProfessorResearchGroupRequest(ProfessorResearchGroupRequestDTO request) {
        User currentUser = currentUserService.getUser();

        if (currentUser.getResearchGroup() != null) {
            throw new IllegalStateException("User already belongs to a research group");
        }

        if (researchGroupRepository.existsByNameIgnoreCase(request.researchGroupName())) {
            throw new ResourceAlreadyExistsException("Research group with name '" + request.researchGroupName() + "' already exists");
        }

        // TODO: should we update existing user data with the provided info?
        // if (request.firstName() != null) currentUser.setFirstName(request.firstName());
        // if (request.lastName() != null) currentUser.setLastName(request.lastName());
        // if (request.universityId() != null) currentUser.setUniversityId(request.universityID());

        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setName(StringUtil.normalize(request.researchGroupName(), false));
        researchGroup.setUniversityId(request.universityId());
        researchGroup.setHead(request.researchGroupHead());
        researchGroup.setAbbreviation(StringUtil.normalize(request.abbreviation(), false));
        researchGroup.setEmail(request.contactEmail());
        researchGroup.setWebsite(request.website());
        researchGroup.setSchool(request.school());
        researchGroup.setDescription(request.description());
        researchGroup.setDefaultFieldOfStudies(request.defaultFieldOfStudies());
        researchGroup.setStreet(request.street());
        researchGroup.setPostalCode(request.postalCode());
        researchGroup.setCity(request.city());
        researchGroup.setState(ResearchGroupState.DRAFT);

        ResearchGroup saved = researchGroupRepository.save(researchGroup);

        currentUser.setResearchGroup(saved);
        userRepository.save(currentUser);

        UserResearchGroupRole role = new UserResearchGroupRole();
        role.setUser(currentUser);
        role.setResearchGroup(saved);
        role.setRole(UserRole.PROFESSOR);
        userResearchGroupRoleRepository.save(role);

        log.info(
            "AUDIT professor-onboarding.create-research-group userId={} groupId={} name={}",
            currentUser.getUserId(),
            saved.getResearchGroupId(),
            request.researchGroupName()
        );

        return saved;
    }
}
