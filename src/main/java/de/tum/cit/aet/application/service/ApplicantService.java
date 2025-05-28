package de.tum.cit.aet.application.service;

import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
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
     * @return list of document dictionary entries of type CV
     */
    public List<DocumentDictionary> getCVs(Applicant applicant) {
        return documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.CV);
    }

    /**
     * Retrieves all reference document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve references for
     * @return list of document dictionary entries of type REFERENCE
     */
    public List<DocumentDictionary> getReferences(Applicant applicant) {
        return documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.REFERENCE);
    }

    /**
     * Retrieves all bachelor transcript document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve bachelor transcripts for
     * @return list of document dictionary entries of type BACHELOR_TRANSCRIPT
     */
    public List<DocumentDictionary> getBachelorTranscripts(Applicant applicant) {
        return documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.BACHELOR_TRANSCRIPT);
    }

    /**
     * Retrieves all master transcript document entries for the given applicant.
     *
     * @param applicant the applicant to retrieve master transcripts for
     * @return list of document dictionary entries of type MASTER_TRANSCRIPT
     */
    public List<DocumentDictionary> getMasterTranscripts(Applicant applicant) {
        return documentDictionaryService.getDocumentDictionaries(applicant, DocumentType.MASTER_TRANSCRIPT);
    }

    /**
     * Downloads all CV documents for the given applicant.
     *
     * @param applicant the applicant whose CVs should be downloaded
     * @return list of resources representing the downloaded CVs
     */
    public Resource downloadCV(Applicant applicant) {
        List<DocumentDictionary> documentDictionaries = getCVs(applicant);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList()
            .getFirst();
    }

    /**
     * Downloads all reference documents for the given applicant.
     *
     * @param applicant the applicant whose references should be downloaded
     * @return list of resources representing the downloaded references
     */
    public List<Resource> downloadReferences(Applicant applicant) {
        List<DocumentDictionary> documentDictionaries = getReferences(applicant);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList();
    }

    /**
     * Downloads all bachelor transcript documents for the given applicant.
     *
     * @param applicant the applicant whose bachelor transcripts should be downloaded
     * @return list of resources representing the downloaded bachelor transcripts
     */
    public List<Resource> downloadBachelorTranscripts(Applicant applicant) {
        List<DocumentDictionary> documentDictionaries = getBachelorTranscripts(applicant);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList();
    }

    /**
     * Downloads all master transcript documents for the given applicant.
     *
     * @param applicant the applicant whose master transcripts should be downloaded
     * @return list of resources representing the downloaded master transcripts
     */
    public List<Resource> downloadMasterTranscripts(Applicant applicant) {
        List<DocumentDictionary> documentDictionaries = getMasterTranscripts(applicant);
        return documentDictionaries
            .stream()
            .map(documentDictionary -> documentService.download(documentDictionary.getDocument().getDocumentId()))
            .toList();
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
        updateDocumentDictionaries(applicant, DocumentType.CV, List.of(document));
    }

    /**
     * Uploads multiple reference documents and updates the dictionary mapping.
     *
     * @param references the uploaded reference files
     * @param applicant the applicant the references belong to
     * @param user the user uploading the documents
     */
    public void uploadReferences(List<MultipartFile> references, Applicant applicant, User user) {
        List<Document> documents = references.stream().map(file -> documentService.upload(file, user)).toList();
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
        List<Document> documents = bachelorTranscripts.stream().map(file -> documentService.upload(file, user)).toList();
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
        List<Document> documents = masterTranscripts.stream().map(file -> documentService.upload(file, user)).toList();
        updateDocumentDictionaries(applicant, DocumentType.MASTER_TRANSCRIPT, documents);
    }

    /**
     * Updates the document dictionary entries for a given applicant and document type.
     *
     * @param applicant      the applicant to associate the documents with
     * @param type           the type of documents being updated (e.g., CV, REFERENCE)
     * @param newDocuments   the list of newly uploaded documents to associate
     */
    protected void updateDocumentDictionaries(Applicant applicant, DocumentType type, List<Document> newDocuments) {
        List<DocumentDictionary> existingEntries = documentDictionaryService.getDocumentDictionaries(applicant, type);
        documentDictionaryService.updateDocumentDictionaries(existingEntries, newDocuments, type, dd -> dd.setApplicant(applicant));
    }
}
