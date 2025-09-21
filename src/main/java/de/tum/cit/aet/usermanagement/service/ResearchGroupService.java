package de.tum.cit.aet.usermanagement.service;

import org.springframework.stereotype.Service;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;

import java.util.UUID;

@Service
public class ResearchGroupService {

    private final ResearchGroupRepository researchGroupRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    public ResearchGroupService(
            ResearchGroupRepository researchGroupRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService) {
        this.researchGroupRepository = researchGroupRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;

    }

    /**
     * Retrieves the details of a research group by its ID.
     * Only users belonging to the research group can access its details.
     *
     * @param researchGroupId the unique identifier of the research group
     * @return a {@link ResearchGroupLargeDTO} containing detailed information about
     *         the research group
     * @throws EntityNotFoundException if the research group is not found or user
     *                                 doesn't have access
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
