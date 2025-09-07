package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing research groups.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ResearchGroupService {

    private final ResearchGroupRepository researchGroupRepository;

    /**
     * Retrieves a research group by its ID.
     *
     * @param researchGroupId the ID of the research group
     * @return the research group DTO
     * @throws EntityNotFoundException if the research group is not found
     */
    @Transactional(readOnly = true)
    public ResearchGroupDTO getResearchGroup(UUID researchGroupId) {        
        ResearchGroup researchGroup = researchGroupRepository.findByIdElseThrow(researchGroupId);
        return ResearchGroupDTO.getFromEntity(researchGroup);
    }

    /**
     * Retrieves all research groups.
     *
     * @return list of all research group DTOs
     */
    @Transactional(readOnly = true)
    public List<ResearchGroupDTO> getAllResearchGroups() {        
        return researchGroupRepository.findAll()
            .stream()
            .map(ResearchGroupDTO::getFromEntity)
            .toList();
    }

    /**
     * Updates an existing research group.
     *
     * @param researchGroupId the ID of the research group to update
     * @param researchGroupDTO the research group data to update
     * @return the updated research group DTO
     * @throws EntityNotFoundException if the research group is not found
     */
    public ResearchGroupDTO updateResearchGroup(UUID researchGroupId, ResearchGroupDTO researchGroupDTO) {        
        ResearchGroup researchGroup = researchGroupRepository.findByIdElseThrow(researchGroupId);
        updateEntityFromDTO(researchGroup, researchGroupDTO);
        
        ResearchGroup updatedResearchGroup = researchGroupRepository.save(researchGroup);
        return ResearchGroupDTO.getFromEntity(updatedResearchGroup);
    }

    /**
     * Checks if a research group exists by its ID.
     *
     * @param researchGroupId the ID of the research group
     * @return true if the research group exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean existsById(UUID researchGroupId) {
        return researchGroupRepository.existsById(researchGroupId);
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
}