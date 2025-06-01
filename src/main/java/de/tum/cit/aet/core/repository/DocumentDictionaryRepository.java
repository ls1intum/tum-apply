package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentDictionaryRepository extends TumApplyJpaRepository<DocumentDictionary, UUID> {
    Set<DocumentDictionary> findByApplicantAndDocumentType(Applicant applicant, DocumentType documentType);

    Set<DocumentDictionary> findByApplicationAndDocumentType(Application application, DocumentType documentType);

    Set<DocumentDictionary> findByCustomFieldAnswer(CustomFieldAnswer customFieldAnswer);
}
