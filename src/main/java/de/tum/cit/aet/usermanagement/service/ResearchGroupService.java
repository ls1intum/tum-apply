package de.tum.cit.aet.usermanagement.service;

import com.nimbusds.oauth2.sdk.http.HTTPResponse;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupCreationDTO;
import org.springframework.stereotype.Service;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupLargeDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;

import java.util.Optional;
import java.util.UUID;

@Service
public class ResearchGroupService {

    private final ResearchGroupRepository researchGroupRepository;
    private final CurrentUserService currentUserService;

    public ResearchGroupService(
        ResearchGroupRepository researchGroupRepository, CurrentUserService currentUserService) {
        this.researchGroupRepository = researchGroupRepository;
        this.currentUserService = currentUserService;
    }

    /**
     * Retrieves the details of a research group by its ID.
     *
     * @param researchGroupId the unique identifier of the research group
     * @return a {@link ResearchGroupLargeDTO} containing detailed information about
     * the research group
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

    public ResearchGroup createResearchGroup(ResearchGroupCreationDTO researchGroupCreationDTO) {
        //IF THUNGY ERSETZEN NACH MARC FRAEN
        if (currentUserService.isProfessor()) {
            Optional<ResearchGroup> researchGroup = researchGroupRepository.findByUniversityID(researchGroupCreationDTO.universityID());
            if (researchGroup.isEmpty()) {
                ResearchGroup newResearchGroup = new ResearchGroup();
                newResearchGroup.setName(researchGroupCreationDTO.name());
                newResearchGroup.setHead(researchGroupCreationDTO.headName());
                newResearchGroup.setUniversityID(researchGroupCreationDTO.universityID());
                return researchGroupRepository.save(newResearchGroup);
            }
            return researchGroup.orElseThrow();
        }

        //ANPASSEEENNNN!!!
        return null;
    }

}


