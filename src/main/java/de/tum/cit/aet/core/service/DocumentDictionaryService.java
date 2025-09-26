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
import lombok.AllArgsConstructor;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class DocumentDictionaryService {

    private CurrentUserService currentUserService;
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
        Set<UUID> existingDocumentIds = existingEntries
            .stream()
            .map(dd -> dd.getDocument().getDocumentId())
            .collect(Collectors.toSet());

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
        assertCanManageDocument(documentDictionaryId);
        documentDictionaryRepository.deleteById(documentDictionaryId);
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
     * grouped by document type;
     * never {@code null}, but fields may be empty if no documents are
     * associated
     * @throws IllegalArgumentException if the {@code application} is {@code null}
     */
    public ApplicationDocumentIdsDTO getDocumentIdsDTO(Application application) {
        if (application==null) {
            throw new IllegalArgumentException("Application may not be null");
        }
        return documentDictionaryRepository.getApplicationDocumentIdsDTOByApplicationId(application.getApplicationId());
    }

    /**
     * Updates the name of the document with the given ID.
     *
     * @param documentDictionaryId the ID of the document to rename
     * @param newName              the new name to set for the document
     */
    public void renameDocument(UUID documentDictionaryId, String newName) {
        DocumentDictionary documentDictionary = assertCanManageDocument(documentDictionaryId);
        documentDictionary.setName(newName);
        documentDictionaryRepository.save(documentDictionary);
    }

    /**
     * Get all {@link DocumentDictionary} entries for an application
     *
     * @param applicationId the id of the application
     * @return a {@link Set} of {@link DocumentDictionary}
     */
    public Set<DocumentDictionary> findAllByApplication(UUID applicationId) {
        return documentDictionaryRepository.findAllByApplicationApplicationId(applicationId);
    }

    /**
     * Asserts that the current user can manage the applicant with the given ID.
     *
     * @param documentId the id of the document to check
     * @return the documentDictionary entity if the user can manage it
     */
    private DocumentDictionary assertCanManageDocument(UUID documentId) {
        DocumentDictionary documentDictionary = documentDictionaryRepository.findById(documentId)
            .orElseThrow(() -> new EntityNotFoundException("Document with id " + documentId + " not found"));
        currentUserService.isCurrentUserOrAdmin(documentDictionary.getApplication().getApplicant().getUserId());
        return documentDictionary;
    }
}
