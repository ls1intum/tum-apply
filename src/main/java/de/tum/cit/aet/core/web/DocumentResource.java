package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.domain.DocumentDictionary;
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
@RequestMapping("/api/document-download")
@AllArgsConstructor
public class DocumentResource {

    private final DocumentService documentService;
    private final DocumentDictionaryService documentDictionaryService;

    /**
     * Downloads a document by its associated DocumentDictionary ID.
     *
     * @param documentDictionaryId the UUID of the DocumentDictionary
     * @return the file as a downloadable HTTP resource
     */
    @GetMapping("/{documentDictionaryId}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable UUID documentDictionaryId) {
        //TODO authorize access
        DocumentDictionary documentDictionary = documentDictionaryService.findDocumentDictionaryById(documentDictionaryId);
        return ResponseEntity.ok(documentService.download(documentDictionary.getDocument().getDocumentId()));
    }
}
