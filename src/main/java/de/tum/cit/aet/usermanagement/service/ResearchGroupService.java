package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResearchGroupService {
    
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final ResearchGroupRepository researchGroupRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    public ResearchGroupService(
        UserRepository userRepository,
        CurrentUserService currentUserService,
        ResearchGroupRepository researchGroupRepository,
        UserResearchGroupRoleRepository userResearchGroupRoleRepository
    ) {
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.researchGroupRepository = researchGroupRepository;
        this.userResearchGroupRoleRepository = userResearchGroupRoleRepository;
    }

    /**
     * Get all members of the current user's research group.
     *
     * @param pageDTO pagination information
     * @return paginated list of research group members
     */
    public PageResponseDTO<UserShortDTO> getResearchGroupMembers(PageDTO pageDTO) {
        // Get the current user's research group ID
        UUID researchGroupId = currentUserService.getResearchGroupIdIfProfessor();
        
        // Create pageable without sorting since we can't order by firstName/lastName in the ID query
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize());
        
        // First query: Get paginated user IDs (ordering will be applied in second query)
        Page<UUID> userIdsPage = userRepository.findUserIdsByResearchGroupId(researchGroupId, pageable);
        
        if (userIdsPage.isEmpty()) {
            return new PageResponseDTO<>(List.of(), 0L);
        }
        
        // Second query: Fetch full user data with collections for the paginated IDs
        // Pass current user ID to sort current user first
        UUID currentUserId = currentUserService.getUserId();
        List<User> members = userRepository.findUsersWithRolesByIdsForResearchGroup(userIdsPage.getContent(), currentUserId);
        
        return new PageResponseDTO<>(
            members.stream().map(UserShortDTO::new).toList(), 
            userIdsPage.getTotalElements()
        );
    }

    /**
     * Search for database users that are not yet members of any research group.
     * Results are limited to 8 users maximum.
     *
     * @param query the search query string
     * @return list of available users not in research groups (max 8 results)
     */
    @Transactional(readOnly = true)
    public List<UserShortDTO> searchAvailableUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        // First, get the user IDs (with limit applied at database level)
        List<UUID> userIds = userRepository.findAvailableUserIdsByQuery(query.trim());
        
        if (userIds.isEmpty()) {
            return List.of();
        }

        // Then, fetch the full users with their collections eagerly loaded
        List<User> availableUsers = userRepository.findUsersWithRolesByIds(userIds);

        // Convert to UserShortDTO
        return availableUsers.stream()
            .map(UserShortDTO::new)
            .collect(Collectors.toList());
    }

    /**
     * Removes a member from the current user's research group.
     *This operation removes both the direct research group membership and all associated roles.
     * @param userId the ID of the user to remove from the research group
     * @throws EntityNotFoundException if the user is not found or not in the same research group
     */
    public void removeMemberFromResearchGroup(UUID userId) {
        // Get the current user's research group ID
        UUID researchGroupId = currentUserService.getResearchGroupIdIfProfessor();
        
        // Verify that the user exists and belongs to the same research group
        User userToRemove = userRepository.findByIdElseThrow(userId);
        
        if (userToRemove.getResearchGroup() == null) {
            throw new EntityNotFoundException("User is not a member of any research group");
        }
        
        if (!userToRemove.getResearchGroup().getResearchGroupId().equals(researchGroupId)) {
            throw new EntityNotFoundException("User is not a member of your research group");
        }
        
        // Prevent removing oneself
        UUID currentUserId = currentUserService.getUserId();
        if (userId.equals(currentUserId)) {
            throw new IllegalArgumentException("Cannot remove yourself from the research group");
        }
        
        // Remove the direct research group membership
        userToRemove.setResearchGroup(null);
        userRepository.save(userToRemove);
        
        // Remove research group associations from user's roles (preserves role entries)
        userResearchGroupRoleRepository.removeResearchGroupFromUserRoles(userId);
    }

    /**
     * Retrieves the details of a research group by its ID.
     *
     * @param researchGroupId the unique identifier of the research group
     * @return a {@link ResearchGroupLargeDTO} containing detailed information about
     *         the research group
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
}
