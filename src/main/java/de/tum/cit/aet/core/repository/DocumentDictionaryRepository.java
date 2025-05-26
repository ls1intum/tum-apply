package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentDictionaryRepository extends TumApplyJpaRepository<DocumentDictionary, UUID> {
    List<DocumentDictionary> findByApplicantAndDocumentType(Applicant applicant, DocumentType documentType);

    List<DocumentDictionary> findByApplicationAndDocumentType(Application application, DocumentType documentType);

    List<DocumentDictionary> findByCustomFieldAnswerAndDocumentType(CustomFieldAnswer customFieldAnswer, DocumentType documentType);
}
