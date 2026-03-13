package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.repository.DocumentRepository;
import java.util.UUID;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentZipUtility {

    private final DocumentRepository documentRepository;
    private final ZipExportService zipExportService;

    /**
     * Adds a document to the ZIP archive.
     *
     * @param zipOut the ZIP output stream to which the document will be added
     * @param documentId the unique identifier of the document to retrieve and add
     * @param entryPath the path within the ZIP archive where the document will be placed
     * @throws UserDataExportException if the document cannot be found or added to the ZIP export
     */
    public void addDocumentToZip(ZipOutputStream zipOut, UUID documentId, String entryPath) {
        try {
            Document document = documentRepository
                .findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

            zipExportService.addDocumentToZip(zipOut, entryPath, document);
        } catch (Exception e) {
            throw new UserDataExportException("Failed to add document to ZIP export", e);
        }
    }
}
