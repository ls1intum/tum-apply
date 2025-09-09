package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResearchGroupService {
    
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final ResearchGroupRepository researchGroupRepository;

    public ResearchGroupService(
        UserResearchGroupRoleRepository userResearchGroupRoleRepository,
        UserRepository userRepository,
        CurrentUserService currentUserService,
        ResearchGroupRepository researchGroupRepository
    ) {
        this.userResearchGroupRoleRepository = userResearchGroupRoleRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.researchGroupRepository = researchGroupRepository;
    }

    /**
     * Get all members of a research group.
     *
     * @param researchGroupId the research group ID
     * @return list of research group members
     */
    public List<UserShortDTO> getResearchGroupMembers(UUID researchGroupId) {
        Set<UserResearchGroupRole> userRoles = userResearchGroupRoleRepository
            .findAllByResearchGroupResearchGroupId(researchGroupId);

        return userRoles.stream()
            .map(role -> new UserShortDTO(role.getUser()))
            .collect(Collectors.toList());
    }

    /**
     * Get all members of the current user's research group.
     *
     * @return list of research group members
     */
    public List<UserShortDTO> getCurrentUserResearchGroupMembers() {
        ResearchGroup researchGroup = currentUserService.getResearchGroupIfProfessor();
        return getResearchGroupMembers(researchGroup.getResearchGroupId());
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
