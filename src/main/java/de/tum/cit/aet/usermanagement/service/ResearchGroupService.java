package de.tum.cit.aet.usermanagement.service;


import java.util.Optional;
import java.util.UUID;

import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;


import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupCreationDTO;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;


import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import lombok.extern.slf4j.Slf4j;

import lombok.RequiredArgsConstructor;

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

        return new PageResponseDTO<>(
            members.stream().map(UserShortDTO::new).toList(),
            userIdsPage.getTotalElements()
        );
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
        User userToRemove = userRepository.findWithResearchGroupRolesByUserId(userId)
            .orElseThrow(() -> EntityNotFoundException.forId("User", userId));

        // Ensure user belongs to the same research group
        if (userToRemove.getResearchGroup() == null ||
            !userToRemove.getResearchGroup().getResearchGroupId().equals(currentUserResearchGroupId)) {
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
     *
     * @param researchGroupId the ID of the research group
     * @return the detailed research group DTO
     * @throws EntityNotFoundException if the research group is not found
     */

    public ResearchGroupLargeDTO getResearchGroupDetails(UUID researchGroupId) {
        ResearchGroup researchGroup = researchGroupRepository.findById(researchGroupId)
                .orElseThrow(() -> EntityNotFoundException.forId("ResearchGroup", researchGroupId));

        return new ResearchGroupLargeDTO(
                researchGroup.getDescription(),
                researchGroup.getEmail(),
                researchGroup.getWebsite(),
                researchGroup.getStreet(),
                researchGroup.getPostalCode(),
                researchGroup.getCity());
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
     * Creates a research group if the current user is professor; returns existing if found.
     *
     * @param dto the research group creation request DTO
     * @return the created or existing research group
     */
    public ResearchGroup createResearchGroup(ResearchGroupCreationDTO dto) {
        Optional<ResearchGroup> existing = researchGroupRepository.findByUniversityId(dto.universityId());
        if (existing.isPresent()) {
            log.info("AUDIT research-group.create reused by={} groupId={} name={} headName={} universityId={}",
                currentUserService.getUserId(),
                existing.get().getResearchGroupId(),
                dto.name(),
                dto.headName(),
                dto.universityId());
            throw new ResourceAlreadyExistsException(
                "ResearchGroup for head with universityId '" + dto.universityId() + "' already exists"
            );
        }

        ResearchGroup newResearchGroup = new ResearchGroup();
        newResearchGroup.setName(dto.name());
        newResearchGroup.setHead(dto.headName());
        newResearchGroup.setUniversityId(dto.universityId());
        newResearchGroup.setDescription(dto.description());
        newResearchGroup.setStreet(dto.street());
        newResearchGroup.setPostalCode(dto.postalCode());
        newResearchGroup.setCity(dto.city());
        newResearchGroup.setDefaultFieldOfStudies(dto.defaultFieldOfStudies());
       newResearchGroup.setAbbreviation(dto.abbreviation());
       newResearchGroup.setWebsite(dto.website());
       newResearchGroup.setSchool(dto.school());

        ResearchGroup saved = researchGroupRepository.save(newResearchGroup);
        log.info("AUDIT research-group.create created by={} groupId={} name={} headName={} universityId={}",
            currentUserService.getUserId(),
            saved.getResearchGroupId(),
            dto.name(),
            dto.headName(),
            dto.universityId());
        return saved;

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
    public ResearchGroup provisionResearchGroup(ResearchGroupCreationDTO dto) {
        User user = userRepository.findByUniversityIdIgnoreCase(dto.universityId())
            .orElseThrow(() -> new EntityNotFoundException(
                "User with universityId '%s' not found".formatted(dto.universityId())
            ));

        ResearchGroup group = researchGroupRepository.findByNameIgnoreCase(dto.name())
            .orElseThrow(() -> new EntityNotFoundException(
                "ResearchGroup with name '%s' not found (must be created manually).".formatted(dto.name())
            ));

        boolean userGroupChanged = false;
        if (user.getResearchGroup() == null
            || !group.getResearchGroupId().equals(user.getResearchGroup().getResearchGroupId())) {
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


        log.info("AUDIT research-group.provision by={} targetUserId={} targetUniId={} groupId={} groupName={} userGroupChanged={} roleOutcome={}",
            currentUserService.getUserId(),
            user.getUserId(),
            dto.universityId(),
            group.getResearchGroupId(),
            group.getName(),
            userGroupChanged,
            roleOutcome);

        return group;
    }
}
