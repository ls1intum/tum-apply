package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class DocumentDictionaryService {

    private DocumentDictionaryRepository documentDictionaryRepository;

    public DocumentDictionary save(DocumentDictionary documentDictionary) {
        return documentDictionaryRepository.save(documentDictionary);
    }

    public void delete(DocumentDictionary documentDictionary) {
        documentDictionaryRepository.delete(documentDictionary);
    }

    public List<DocumentDictionary> getDocumentDictionaries(Applicant applicant, DocumentType documentType) {
        return documentDictionaryRepository.findByApplicantAndDocumentType(applicant, documentType);
    }

    public List<DocumentDictionary> getDocumentDictionaries(Application application, DocumentType documentType) {
        return documentDictionaryRepository.findByApplicationAndDocumentType(application, documentType);
    }

    public List<DocumentDictionary> getDocumentDictionaries(CustomFieldAnswer customFieldAnswer, DocumentType documentType) {
        return documentDictionaryRepository.findByCustomFieldAnswerAndDocumentType(customFieldAnswer, documentType);
    }
}
