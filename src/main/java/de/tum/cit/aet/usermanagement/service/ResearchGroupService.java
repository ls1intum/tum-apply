package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResearchGroupService {
    
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final CurrentUserService currentUserService;

    public ResearchGroupService(
        UserResearchGroupRoleRepository userResearchGroupRoleRepository,
        CurrentUserService currentUserService
    ) {
        this.userResearchGroupRoleRepository = userResearchGroupRoleRepository;
        this.currentUserService = currentUserService;
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
}
