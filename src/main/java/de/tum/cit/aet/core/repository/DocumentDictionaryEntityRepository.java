package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import java.util.UUID;

/**
 * Repository interface for accessing document dictionary data related to a specific application.
 * This interface defines custom query methods for retrieving structured document identifiers.
 * This Repository interface is needed to extend the {@link DocumentRepository} with CriteriaBuilder Functionality that are defined by {@link DocumentDictionaryEntityRepositoryImpl}
 */
public interface DocumentDictionaryEntityRepository {
    /**
     * Retrieves a DTO containing categorized document dictionary IDs (e.g., Bachelor, Master, Reference, CV)
     * associated with a specific application.
     *
     * @param applicationId the unique identifier of the application
     * @return an {@link ApplicationDocumentIdsDTO} containing grouped document IDs relevant to the application
     */
    public ApplicationDocumentIdsDTO getApplicationDocumentIdsDTOByApplicationId(UUID applicationId);
}
