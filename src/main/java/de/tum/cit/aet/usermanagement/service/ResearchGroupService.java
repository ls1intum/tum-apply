package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing research groups.
 */
@Slf4j
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
        log.debug("Fetching research group with ID: {}", researchGroupId);
        
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
        log.debug("Fetching all research groups");
        
        return researchGroupRepository.findAll()
            .stream()
            .map(ResearchGroupDTO::getFromEntity)
            .toList();
    }

    /**
     * Creates a new research group.
     *
     * @param researchGroupDTO the research group data
     * @return the created research group DTO
     */
    public ResearchGroupDTO createResearchGroup(ResearchGroupDTO researchGroupDTO) {
        log.debug("Creating new research group with name: {}", researchGroupDTO.name());
        
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroupDTO.updateEntity(researchGroup);
        
        ResearchGroup savedResearchGroup = researchGroupRepository.save(researchGroup);
        return ResearchGroupDTO.getFromEntity(savedResearchGroup);
    }

    /**
     * Updates an existing research group.
     * Only non-null fields in the DTO will be modified, supporting partial updates.
     *
     * @param researchGroupId the ID of the research group to update
     * @param researchGroupDTO the research group data (partial or complete)
     * @return the updated research group DTO
     * @throws EntityNotFoundException if the research group is not found
     */
    public ResearchGroupDTO updateResearchGroup(UUID researchGroupId, ResearchGroupDTO researchGroupDTO) {
        log.debug("Updating research group with ID: {}", researchGroupId);
        
        ResearchGroup researchGroup = researchGroupRepository.findByIdElseThrow(researchGroupId);
        researchGroupDTO.updateEntity(researchGroup);
        
        ResearchGroup updatedResearchGroup = researchGroupRepository.save(researchGroup);
        return ResearchGroupDTO.getFromEntity(updatedResearchGroup);
    }

    /**
     * Deletes a research group by its ID.
     *
     * @param researchGroupId the ID of the research group to delete
     * @throws EntityNotFoundException if the research group is not found
     */
    public void deleteResearchGroup(UUID researchGroupId) {
        log.debug("Deleting research group with ID: {}", researchGroupId);
        
        if (!researchGroupRepository.existsById(researchGroupId)) {
            throw EntityNotFoundException.forId("ResearchGroup", researchGroupId);
        }
        
        researchGroupRepository.deleteById(researchGroupId);
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
}