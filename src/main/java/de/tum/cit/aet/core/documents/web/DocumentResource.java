package de.tum.cit.aet.core.documents.web;

import de.tum.cit.aet.core.documents.service.DocumentService;
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

    @GetMapping("/{documentId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID documentId) {
        log.info("GET /api/documents/{} - Download request received", documentId);
        return ResponseEntity.ok(documentService.downloadDocument(documentId));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(@PathVariable UUID documentId) {
        documentService.deleteById(documentId);
        return ResponseEntity.noContent().build();
    }
}
