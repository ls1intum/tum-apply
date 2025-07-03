package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.service.support.DocumentDictionaryOwnerSetter;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class DocumentDictionaryService {

    private DocumentDictionaryRepository documentDictionaryRepository;

    /**
     * Synchronizes the document dictionary entries with a new set of documents.
     * The owning entity (e.g., Applicant, Application) is set dynamically using the
     * provided {@code ownerSetter}.
     *
     * @param existingEntries the current document dictionary entries associated
     *                        with an entity
     * @param newDocuments    the newly uploaded documents to be associated
     * @param type            the type of documents being updated (e.g., CV,
     *                        REFERENCE)
     * @param ownerSetter     a functional interface used to set the owning entity
     *                        (e.g., via {@code setApplicant()} or
     *                        {@code setApplication()})
     */
    public void updateDocumentDictionaries(
        Set<DocumentDictionary> existingEntries,
        Set<Pair<Document, String>> newDocuments,
        DocumentType type,
        DocumentDictionaryOwnerSetter ownerSetter
    ) {
        Set<UUID> newDocumentIds = newDocuments.stream().map(f -> f.getFirst().getDocumentId()).collect(Collectors.toSet());

        Set<UUID> existingDocumentIds = existingEntries.stream().map(dd -> dd.getDocument().getDocumentId()).collect(Collectors.toSet());

        // Delete outdated entries
        for (DocumentDictionary dd : existingEntries) {
            if (!newDocumentIds.contains(dd.getDocument().getDocumentId())) {
                deleteById(dd.getDocumentDictionaryId());
            }
        }

        // Add new entries
        for (Pair<Document, String> doc : newDocuments) {
            Document document = doc.getFirst();
            if (!existingDocumentIds.contains(document.getDocumentId())) {
                DocumentDictionary newEntry = new DocumentDictionary();
                ownerSetter.accept(newEntry); // Set owning entity (applicant/application)
                newEntry.setDocument(document);
                newEntry.setName(doc.getSecond());
                newEntry.setDocumentType(type);
                save(newEntry);
            }
        }
    }

    /**
     * Retrieves a {@link DocumentDictionary} entity by its unique identifier.
     *
     * @param id the UUID of the DocumentDictionary to retrieve
     * @return the {@link DocumentDictionary} entity associated with the given ID
     * @throws EntityNotFoundException if no DocumentDictionary is found for the
     *                                 provided ID
     */
    public DocumentDictionary findDocumentDictionaryById(UUID id) {
        return documentDictionaryRepository
            .findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Document dictionary with id " + id + " not found"));
    }

    /**
     * Persists a DocumentDictionary entry to the database.
     *
     * @param documentDictionary the document dictionary entry to save
     * @return the saved DocumentDictionary entity
     */
    public DocumentDictionary save(DocumentDictionary documentDictionary) {
        return documentDictionaryRepository.save(documentDictionary);
    }

    /**
     * Deletes a DocumentDictionary entry from the database.
     *
     * @param documentDictionaryId the id of the document dictionary entry to delete
     */
    public void deleteById(UUID documentDictionaryId) {
        if (!documentDictionaryRepository.existsById(documentDictionaryId)) {
            throw new EntityNotFoundException("DocumentDictionaryId does not exist");
        }
        documentDictionaryRepository.deleteById(documentDictionaryId);
    }

    /**
     * Deletes all document dictionary entries associated with the given application
     * and document type.
     *
     * @param application  the application associated with the documents
     * @param documentType the type of documents to delete
     */
    public void deleteByApplicationAndType(Application application, DocumentType documentType) {
        Set<DocumentDictionary> documentDictionaries = getDocumentDictionaries(application, documentType);
        this.documentDictionaryRepository.deleteAll(documentDictionaries);
    }

    /**
     * Retrieves all DocumentDictionary entries for a given applicant and document
     * type.
     *
     * @param applicant    the applicant whose documents to retrieve
     * @param documentType the type of document to filter by (e.g.,
     *                     BACHELOR_TRANSCRIPT)
     * @return set of matching DocumentDictionary entries
     */
    public Set<DocumentDictionary> getDocumentDictionaries(Applicant applicant, DocumentType documentType) {
        return documentDictionaryRepository.findByApplicantAndDocumentType(applicant, documentType);
    }

    /**
     * Retrieves all DocumentDictionary entries for a given application and document
     * type.
     *
     * @param application  the application whose documents to retrieve
     * @param documentType the type of document to filter by (e.g.,
     *                     BACHELOR_TRANSCRIPT)
     * @return set of matching DocumentDictionary entries
     */
    public Set<DocumentDictionary> getDocumentDictionaries(Application application, DocumentType documentType) {
        return documentDictionaryRepository.findByApplicationAndDocumentType(application, documentType);
    }

    /**
     * Retrieves all DocumentDictionary entries for a given custom field answer.
     *
     * @param customFieldAnswer the custom field answer whose documents to retrieve
     * @return set of matching DocumentDictionary entries
     */
    public Set<DocumentDictionary> getDocumentDictionaries(CustomFieldAnswer customFieldAnswer) {
        return documentDictionaryRepository.findByCustomFieldAnswer(customFieldAnswer);
    }

    /**
     * Retrieves a {@link ApplicationDocumentIdsDTO} containing categorized document
     * IDs
     * associated with the specified {@link Application}.
     *
     * @param application the {@link Application} entity whose related document IDs
     *                    should be retrieved;
     *                    must not be {@code null}
     * @return an {@link ApplicationDocumentIdsDTO} populated with document IDs
     *         grouped by document type;
     *         never {@code null}, but fields may be empty if no documents are
     *         associated
     * @throws IllegalArgumentException if the {@code application} is {@code null}
     */
    public ApplicationDocumentIdsDTO getDocumentIdsDTO(Application application) {
        if (application == null) {
            throw new IllegalArgumentException("Application may not be null");
        }
        return documentDictionaryRepository.getApplicationDocumentIdsDTOByApplicationId(application.getApplicationId());
    }
}
