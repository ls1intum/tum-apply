package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents")
@AllArgsConstructor
public class DocumentResource {

    private final DocumentService documentService;
    private final DocumentDictionaryService documentDictionaryService;
    private final CurrentUserService currentUserService;

    /**
     * Downloads a document by its associated DocumentDictionary ID.
     *
     * @param documentDictionaryId the UUID of the DocumentDictionary
     * @return the file as a downloadable HTTP resource
     */
    @GetMapping("/{documentDictionaryId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID documentDictionaryId) {
        DocumentDictionary documentDictionary = documentDictionaryService.findDocumentDictionaryById(documentDictionaryId);
        verifyAccess(documentDictionary);
        return ResponseEntity.ok(documentService.download(documentDictionary.getDocument()));
    }

    /**
     * Verifies that the current user has access to the given document dictionary.
     * <p>
     * Access is granted based on the following hierarchy:
     * <ul>
     *   <li>If the document is associated with an application:
     *     <ul>
     *       <li>Professors and employees must have access to the associated job</li>
     *       <li>Other users must be the applicant or an admin</li>
     *     </ul>
     *   </li>
     *   <li>If the document is associated with a custom field answer:
     *     <ul>
     *       <li>Professors and employees must have access to the application's job</li>
     *       <li>Other users must be the applicant or an admin</li>
     *     </ul>
     *   </li>
     *   <li>If the document is associated with an applicant directly, the current user must be that applicant or an admin</li>
     * </ul>
     * <p>
     * If the document has no owner association, an {@link AccessDeniedException} is thrown.
     *
     * @param documentDictionary the document dictionary to verify access for
     * @throws AccessDeniedException if the current user does not have access or if the document has no owner association
     */
    private void verifyAccess(DocumentDictionary documentDictionary) {
        if (documentDictionary.getApplication() != null) {
            var application = documentDictionary.getApplication();
            if (currentUserService.isProfessor() || currentUserService.isEmployee()) {
                currentUserService.verifyJobAccess(application.getJob());
                return;
            }
            currentUserService.isCurrentUserOrAdmin(application.getApplicant().getUserId());
            return;
        }

        if (documentDictionary.getCustomFieldAnswer() != null) {
            var application = documentDictionary.getCustomFieldAnswer().getApplication();
            if (currentUserService.isProfessor() || currentUserService.isEmployee()) {
                currentUserService.verifyJobAccess(application.getJob());
                return;
            }
            currentUserService.isCurrentUserOrAdmin(application.getApplicant().getUserId());
            return;
        }

        if (documentDictionary.getApplicant() != null) {
            currentUserService.isCurrentUserOrAdmin(documentDictionary.getApplicant().getUserId());
            return;
        }

        throw new AccessDeniedException("Cannot verify access for document without owner association");
    }
}
