package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface DocumentDictionaryRepository extends TumApplyJpaRepository<DocumentDictionary, UUID>, DocumentDictionaryEntityRepository {
    Set<DocumentDictionary> findByApplicantAndDocumentType(Applicant applicant, DocumentType documentType);

    Set<DocumentDictionary> findByApplicationAndDocumentType(Application application, DocumentType documentType);

    Set<DocumentDictionary> findByCustomFieldAnswer(CustomFieldAnswer customFieldAnswer);

    Set<DocumentDictionary> findAllByApplicant(Applicant applicant);

    Set<DocumentDictionary> findAllByApplicationApplicationId(UUID applicationId);

    /**
     * Deletes all document dictionary entries for a specific applicant.
     *
     * @param applicantId the UUID of the applicant whose document dictionary entries should be deleted
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM DocumentDictionary dd WHERE dd.applicantId = :applicantId ", nativeQuery = true)
    void deleteByApplicantId(@Param("applicantId") UUID applicantId);

    /**
     * Anonymizes all document dictionary entries for a specific applicant.
     *
     * @param applicantId the UUID of the applicant whose document dictionary entries should be anonymized
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE DocumentDictionary dd SET dd.applicantId = NULL WHERE dd.applicantId = :applicantId ", nativeQuery = true)
    void anonymizeByApplicantId(@Param("applicantId") UUID applicantId);
}
