package de.tum.cit.aet.utility.testdata;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.springframework.mock.web.MockMultipartFile;

/**
 * Test data helpers for Documents + DocumentDictionary.
 */
public final class DocumentTestData {

    private DocumentTestData() {}

    /**
     * Copies a test document from classpath into the given storage root and returns a persisted Document.
     *
     * @param storageRootConfig path from application.yml (e.g., "build/test-docs")
     * @param documentRepository repo to persist Document
     * @param professor uploader user
     * @param classpathResource classpath resource (e.g., "/testdocs/test-doc1.pdf")
     * @param filename target filename inside storage root (e.g., "test-doc1.pdf")
     */
    public static Document savedDocument(
        String storageRootConfig,
        DocumentRepository documentRepository,
        User professor,
        String classpathResource,
        String filename
    ) throws IOException {
        Path storageRoot = Paths.get(storageRootConfig).toAbsolutePath().normalize();
        Files.createDirectories(storageRoot);

        Path pdfPath = storageRoot.resolve(filename);
        try (InputStream in = DocumentTestData.class.getResourceAsStream(classpathResource)) {
            assertThat(in).as("Classpath resource should exist: " + classpathResource).isNotNull();
            Files.copy(in, pdfPath, StandardCopyOption.REPLACE_EXISTING);
        }

        Document doc = new Document();
        doc.setSha256Id(UUID.randomUUID().toString().replace("-", ""));
        doc.setPath(pdfPath.toAbsolutePath().toString());
        doc.setMimeType("application/pdf");
        doc.setSizeBytes(Files.size(pdfPath));
        doc.setUploadedBy(professor);
        return documentRepository.saveAndFlush(doc);
    }

    /**
     * Creates and persists a DocumentDictionary linking an Application, Applicant, and Document.
     *
     * @param document persisted document
     * @param application linked application
     * @param applicant linked applicant
     * @param type document type (e.g. CV, MOTIVATION_LETTER)
     * @param name logical name (e.g. "cv")
     */
    public static DocumentDictionary savedDictionary(
        DocumentDictionaryRepository documentDictionaryRepository,
        Document document,
        Application application,
        Applicant applicant,
        DocumentType type,
        String name
    ) {
        if ((application == null) == (applicant == null)) {
            throw new IllegalArgumentException("Exactly one owner must be set: application XOR applicant.");
        }
        DocumentDictionary dict = new DocumentDictionary();
        dict.setDocument(document);
        dict.setApplication(application);
        dict.setApplicant(applicant);
        dict.setDocumentType(type);
        dict.setName(name);
        return documentDictionaryRepository.saveAndFlush(dict);
    }

    /**
     * Convenience method: persist document from resource and link into DocumentDictionary.
     */
    public static DocumentDictionary savedDictionaryWithDocument(
        String storageRootConfig,
        DocumentRepository documentRepository,
        DocumentDictionaryRepository documentDictionaryRepository,
        User professor,
        Application application,
        Applicant applicant,
        String classpathResource,
        String filename,
        DocumentType type,
        String name
    ) throws IOException {
        Document doc = savedDocument(storageRootConfig, documentRepository, professor, classpathResource, filename);
        return savedDictionary(documentDictionaryRepository, doc, application, applicant, type, name);
    }

    /**
     * Creates and persists a mock Document and DocumentDictionary without actual file resources.
     * Useful for simple tests that don't require actual file content.
     *
     * @param documentRepository repo to persist Document
     * @param documentDictionaryRepository repo to persist DocumentDictionary
     * @param uploadedBy uploader user
     * @param application linked application
     * @param applicant linked applicant (can be null)
     * @param documentType document type (e.g. CV, MOTIVATION_LETTER)
     * @param fileName logical file name (e.g. "test_cv.pdf")
     */
    public static DocumentDictionary savedDictionaryWithMockDocument(
        DocumentRepository documentRepository,
        DocumentDictionaryRepository documentDictionaryRepository,
        User uploadedBy,
        Application application,
        Applicant applicant,
        DocumentType documentType,
        String fileName
    ) {
        // Create mock document
        Document document = new Document();
        document.setSha256Id(UUID.randomUUID().toString());
        document.setPath("/test/path/" + fileName);
        document.setMimeType("application/pdf");
        document.setSizeBytes(1024L);
        document.setUploadedBy(uploadedBy);
        document = documentRepository.save(document);

        // Create document dictionary entry
        return savedDictionary(documentDictionaryRepository, document, application, applicant, documentType, fileName);
    }

    /**
     * Creates a MockMultipartFile for testing document uploads.
     *
     * @param fieldName the form field name (typically "files")
     * @param filename the original filename
     * @param contentType the MIME type (e.g., "application/pdf")
     * @param content the file content as bytes
     * @return a MockMultipartFile instance
     */
    public static MockMultipartFile createMockMultipartFile(String fieldName, String filename, String contentType, byte[] content) {
        return new MockMultipartFile(fieldName, filename, contentType, content);
    }

    /**
     * Creates a MockMultipartFile with default PDF content for testing.
     *
     * @param fieldName the form field name (typically "files")
     * @param filename the original filename
     * @return a MockMultipartFile instance with PDF MIME type and default content
     */
    public static MockMultipartFile createMockPdfFile(String fieldName, String filename) {
        return createMockMultipartFile(fieldName, filename, "application/pdf", "PDF content here".getBytes());
    }

    /**
     * Creates a MockMultipartFile with specific content for testing.
     *
     * @param fieldName the form field name (typically "files")
     * @param filename the original filename
     * @param content the file content as string
     * @return a MockMultipartFile instance with PDF MIME type
     */
    public static MockMultipartFile createMockPdfFile(String fieldName, String filename, String content) {
        return createMockMultipartFile(fieldName, filename, "application/pdf", content.getBytes());
    }
}
