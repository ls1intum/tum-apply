package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.application.domain.Application_;
import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.domain.DocumentDictionary_;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class DocumentDictionaryEntityRepositoryImpl implements DocumentDictionaryEntityRepository {

    @PersistenceContext
    private final EntityManager entityManager;

    @Override
    public ApplicationDocumentIdsDTO getApplicationDocumentIdsDTOByApplicationId(UUID applicationId) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<DocumentDictionary> query = cb.createQuery(DocumentDictionary.class);
        Root<DocumentDictionary> root = query.from(DocumentDictionary.class);

        // WHERE application.id = :applicationId
        Predicate applicationPredicate = cb.equal(root.get(DocumentDictionary_.application).get(Application_.applicationId), applicationId);
        query.select(root).where(applicationPredicate);

        List<DocumentDictionary> results = entityManager.createQuery(query).getResultList();

        ApplicationDocumentIdsDTO dto = new ApplicationDocumentIdsDTO();
        List<UUID> bachelorIds = new ArrayList<>();
        List<UUID> masterIds = new ArrayList<>();
        List<UUID> referenceIds = new ArrayList<>();

        for (DocumentDictionary dd : results) {
            if (dd.getDocument() == null) continue;

            UUID docId = dd.getDocument().getDocumentId();
            switch (dd.getDocumentType()) {
                case BACHELOR_TRANSCRIPT -> bachelorIds.add(docId);
                case MASTER_TRANSCRIPT -> masterIds.add(docId);
                case REFERENCE -> referenceIds.add(docId);
                case CV -> dto.setCvDocumentId(docId);
                default -> {} // For the moment, skip CUSTOM or others
            }
        }

        dto.setBachelorDocumentIds(bachelorIds);
        dto.setMasterDocumentIds(masterIds);
        dto.setReferenceDocumentIds(referenceIds);

        return dto;
    }
}
