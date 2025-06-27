package de.tum.cit.aet.application.service;

import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.usermanagement.domain.Applicant;
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
public class ApplicantService {

    private final DocumentDictionaryService documentDictionaryService;
    private final DocumentService documentService;

    /**
     * Retrieves all CV document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve CVs for
     * @return set of document dictionary entries of type CV
     */
    public Set<DocumentDictionary> getCVs(Applicant applicant) {
        return documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.CV);
    }

    /**
     * Retrieves all reference document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve references for
     * @return set of document dictionary entries of type REFERENCE
     */
    public Set<DocumentDictionary> getReferences(Applicant applicant) {
        return documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.REFERENCE);
    }

    /**
     * Retrieves all bachelor transcript document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve bachelor transcripts for
     * @return set of document dictionary entries of type BACHELOR_TRANSCRIPT
     */
    public Set<DocumentDictionary> getBachelorTranscripts(Applicant applicant) {
        return documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.BACHELOR_TRANSCRIPT);
    }

    /**
     * Retrieves all master transcript document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve master transcripts for
     * @return set of document dictionary entries of type MASTER_TRANSCRIPT
     */
    public Set<DocumentDictionary> getMasterTranscripts(Applicant applicant) {
        return documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.MASTER_TRANSCRIPT);
    }

    /**
     * Uploads a single CV document and updates the dictionary mapping.
     *
     * @param cv the uploaded CV file
     * @param applicant the applicant the CV belongs to
     * @param user the user uploading the document
     */
    public void uploadCV(MultipartFile cv, Applicant applicant, User user) {
        Document document = documentService.upload(cv, user);
        updateDocumentDictionaries(applicant, DocumentType.CV, Set.of(Pair.of(document, cv.getName())));
    }

    /**
     * Uploads multiple documents and updates the dictionary mapping.
     *
     * @param references the uploaded files
     * @param applicant the applicant the belong to
     * @param user the user uploading the documents
     */
    public void uploadTranscripts(List<MultipartFile> references, DocumentType type, Applicant applicant, User user) {
        Set<Pair<Document, String>> documents = references
            .stream()
            .map(file -> Pair.of(documentService.upload(file, user), file.getName()))
            .collect(Collectors.toSet());
        updateDocumentDictionaries(applicant, type, documents);
    }

    /**
     * Updates the document dictionary entries for a given applicant and document type.
     *
     * @param applicant      the applicant to associate the documents with
     * @param type           the type of documents being updated (e.g., CV, REFERENCE)
     * @param newDocuments   the set of newly uploaded documents to associate
     */
    protected void updateDocumentDictionaries(Applicant applicant, DocumentType type, Set<Pair<Document, String>> newDocuments) {
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(applicant, type);
        documentDictionaryService.updateDocumentDictionaries(existingEntries, newDocuments, type, dd -> dd.setApplicant(applicant));
    }
}
