package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.service.DocumentDictionaryService;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/documents")
@AllArgsConstructor
public class DocumentResource {

    private final DocumentDictionaryService documentDictionaryService;

    /**
     * Downloads a document by its associated DocumentDictionary ID.
     *
     * @param documentDictionaryId the UUID of the DocumentDictionary
     * @return the file as a downloadable HTTP resource
     */
    @GetMapping("/{documentDictionaryId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID documentDictionaryId) {
        log.info("GET /api/documents/{} - Download request received", documentDictionaryId);
        return ResponseEntity.ok(documentDictionaryService.downloadDocument(documentDictionaryId));
    }
}
