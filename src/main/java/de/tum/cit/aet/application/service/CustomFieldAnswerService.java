package de.tum.cit.aet.application.service;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.job.constants.CustomFieldType;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@AllArgsConstructor
public class CustomFieldAnswerService {

    private final DocumentDictionaryService documentDictionaryService;
    private final DocumentService documentService;

    /**
     * Retrieves all document dictionaries associated with the given custom field answer.
     *
     * @param customFieldAnswer the custom field answer to retrieve documents for
     * @return a set of associated {@link DocumentDictionary} objects
     */
    public Set<DocumentDictionary> getDocuments(CustomFieldAnswer customFieldAnswer) {
        return documentDictionaryService.getDocumentDictionaries(customFieldAnswer);
    }

    /**
     * Uploads a list of files and associates them with a given custom field answer and user.
     *
     * @param files the list of files to upload
     * @param customFieldAnswer the custom field answer to associate the uploaded documents with
     * @param user the user uploading the documents
     * @throws IllegalArgumentException if the custom field is not of type FILE_UPLOAD
     */
    public void uploadDocuments(List<MultipartFile> files, CustomFieldAnswer customFieldAnswer, User user) {
        if (!customFieldAnswer.getCustomField().getCustomFieldType().equals(CustomFieldType.FILE_UPLOAD)) {
            throw new IllegalArgumentException("CustomField is no FileUpload");
        }
        Set<Pair<Document, String>> documents = files
            .stream()
            .map(file -> Pair.of(documentService.upload(file, user), file.getName()))
            .collect(Collectors.toSet());
        updateDocumentDictionaries(customFieldAnswer, documents);
    }

    /**
     * Updates the document dictionaries associated with the given custom field answer using the provided documents.
     *
     * @param customFieldAnswer the custom field answer to associate the documents with
     * @param newDocuments the set of new documents to update in the dictionaries
     */
    protected void updateDocumentDictionaries(CustomFieldAnswer customFieldAnswer, Set<Pair<Document, String>> newDocuments) {
        documentDictionaryService.updateDocumentDictionaries(getDocuments(customFieldAnswer), newDocuments, null, dd ->
            dd.setCustomFieldAnswer(customFieldAnswer)
        );
    }
}
