package de.tum.cit.aet.core.documents.web;

import de.tum.cit.aet.core.documents.service.DocumentService;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for the unified document model.
 */
@Slf4j
@RestController
@RequestMapping("/api/documents")
@AllArgsConstructor
public class DocumentResource {

    private final DocumentService documentService;

    /**
     * Streams the binary content of a document to the caller.
     *
     * @param documentId the UUID of the document to download
     * @return the document file as a downloadable HTTP resource
     */
    @Authenticated
    @GetMapping("/{documentId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID documentId) {
        log.info("GET /api/documents/{} - Download request received", documentId);
        return ResponseEntity.ok(documentService.downloadDocument(documentId));
    }

    /**
     * Deletes a document by id. Permission is checked at the service layer based on the
     * document's owner type (applicant or application).
     *
     * @param documentId the UUID of the document to delete
     * @return 204 No Content on success
     */
    @Authenticated
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID documentId) {
        log.info("DELETE /api/documents/{} - Delete request received", documentId);
        documentService.deleteById(documentId);
        return ResponseEntity.noContent().build();
    }
}
