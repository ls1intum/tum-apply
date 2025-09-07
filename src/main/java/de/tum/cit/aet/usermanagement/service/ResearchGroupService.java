package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
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
        updateEntityFromDTO(researchGroup, researchGroupDTO);
        
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
        updateEntityFromDTO(researchGroup, researchGroupDTO);
        
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

    /**
     * Updates a ResearchGroup entity with values from the provided DTO.
     * Handles both null values (from partial updates) and empty strings (from frontend forms).
     * Only defaultFieldOfStudies can be null (as per frontend implementation).
     */
    private void updateEntityFromDTO(ResearchGroup entity, ResearchGroupDTO dto) {
        // String fields: frontend sends empty strings, not nulls
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
        
        // Only this field can be null (as per frontend: defaultFieldOfStudies: undefined)
        updateIfNotNull(dto.defaultFieldOfStudies(), entity::setDefaultFieldOfStudies);
    }

    /**
     * Helper method to update a field only if the value is not null.
     * Used for fields that can actually be null from the frontend.
     */
    private <T> void updateIfNotNull(T value, Consumer<T> setter) {
        if (value != null) {
            setter.accept(value);
        }
    }
}