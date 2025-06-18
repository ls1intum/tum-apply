package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import java.util.UUID;

public interface DocumentDictionaryEntityRepository {
    public ApplicationDocumentIdsDTO getApplicationDocumentIdsDTOByApplicationId(UUID applicationId);
}
