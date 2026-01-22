package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentDictionaryRepository extends TumApplyJpaRepository<DocumentDictionary, UUID>, DocumentDictionaryEntityRepository {
    Set<DocumentDictionary> findByApplicantAndDocumentType(Applicant applicant, DocumentType documentType);

    Set<DocumentDictionary> findByApplicationAndDocumentType(Application application, DocumentType documentType);

    Set<DocumentDictionary> findByCustomFieldAnswer(CustomFieldAnswer customFieldAnswer);

    Set<DocumentDictionary> findAllByApplicant(Applicant applicant);

    Set<DocumentDictionary> findAllByApplicationApplicationId(UUID applicationId);

    void deleteByApplication(Application application);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM DocumentDictionary dd WHERE dd.application.applicationId IN :applicationIds")
    void deleteByApplicationIdIn(@Param("applicationIds") List<UUID> applicationIds);
}
