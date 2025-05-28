package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.job.constants.CustomFieldType;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@AllArgsConstructor
public class CustomFieldAnswerService {

    private final DocumentDictionaryService documentDictionaryService;
    private final DocumentService documentService;

    public List<DocumentDictionary> getDocuments(CustomFieldAnswer customFieldAnswer) {
        return documentDictionaryService.getDocumentDictionaries(customFieldAnswer);
    }

    public List<Resource> downloadDocuments(CustomFieldAnswer customFieldAnswer) {
        if (!customFieldAnswer.getCustomField().getCustomFieldType().equals(CustomFieldType.FILE_UPLOAD)) {
            throw new IllegalArgumentException("CustomField is no FileUpload");
        }
        List<DocumentDictionary> documentDictionaries = getDocuments(customFieldAnswer);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList();
    }

    public void uploadDocuments(List<MultipartFile> files, CustomFieldAnswer customFieldAnswer, User user) {
        if (!customFieldAnswer.getCustomField().getCustomFieldType().equals(CustomFieldType.FILE_UPLOAD)) {
            throw new IllegalArgumentException("CustomField is no FileUpload");
        }
        List<Document> documents = files.stream().map(file -> documentService.upload(file, user)).toList();
        updateDocumentDictionaries(customFieldAnswer, documents);
    }

    protected void updateDocumentDictionaries(CustomFieldAnswer customFieldAnswer, List<Document> newDocuments) {
        documentDictionaryService.updateDocumentDictionaries(getDocuments(customFieldAnswer), newDocuments, null, dd ->
            dd.setCustomFieldAnswer(customFieldAnswer)
        );
    }
}
