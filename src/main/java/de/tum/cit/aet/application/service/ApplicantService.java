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
        updateDocumentDictionaries(applicant, DocumentType.CV, Set.of(document));
    }

    /**
     * Uploads multiple reference documents and updates the dictionary mapping.
     *
     * @param references the uploaded reference files
     * @param applicant the applicant the references belong to
     * @param user the user uploading the documents
     */
    public void uploadReferences(List<MultipartFile> references, Applicant applicant, User user) {
        Set<Document> documents = references.stream().map(file -> documentService.upload(file, user)).collect(Collectors.toSet());
        updateDocumentDictionaries(applicant, DocumentType.REFERENCE, documents);
    }

    /**
     * Uploads multiple bachelor transcript documents and updates the dictionary mapping.
     *
     * @param bachelorTranscripts the uploaded bachelor transcript files
     * @param applicant the applicant the transcripts belong to
     * @param user the user uploading the documents
     */
    public void uploadBachelorTranscripts(List<MultipartFile> bachelorTranscripts, Applicant applicant, User user) {
        Set<Document> documents = bachelorTranscripts.stream().map(file -> documentService.upload(file, user)).collect(Collectors.toSet());
        updateDocumentDictionaries(applicant, DocumentType.BACHELOR_TRANSCRIPT, documents);
    }

    /**
     * Uploads multiple master transcript documents and updates the dictionary mapping.
     *
     * @param masterTranscripts the uploaded master transcript files
     * @param applicant the applicant the transcripts belong to
     * @param user the user uploading the documents
     */
    public void uploadMasterTranscripts(List<MultipartFile> masterTranscripts, Applicant applicant, User user) {
        Set<Document> documents = masterTranscripts.stream().map(file -> documentService.upload(file, user)).collect(Collectors.toSet());
        updateDocumentDictionaries(applicant, DocumentType.MASTER_TRANSCRIPT, documents);
    }

    /**
     * Updates the document dictionary entries for a given applicant and document type.
     *
     * @param applicant      the applicant to associate the documents with
     * @param type           the type of documents being updated (e.g., CV, REFERENCE)
     * @param newDocuments   the set of newly uploaded documents to associate
     */
    protected void updateDocumentDictionaries(Applicant applicant, DocumentType type, Set<Document> newDocuments) {
        Set<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(applicant, type);
        documentDictionaryService.updateDocumentDictionaries(existingEntries, newDocuments, type, dd -> dd.setApplicant(applicant));
    }
}
