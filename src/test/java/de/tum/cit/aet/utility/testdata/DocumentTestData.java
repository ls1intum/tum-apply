package de.tum.cit.aet.utility.testdata;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.documents.domain.ApplicantDocument;
import de.tum.cit.aet.core.documents.domain.ApplicationDocument;
import de.tum.cit.aet.core.documents.domain.Document;
import de.tum.cit.aet.core.documents.repository.DocumentRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.springframework.mock.web.MockMultipartFile;

/**
 * Test data helpers for the unified Document model (ApplicantDocument / ApplicationDocument).
 *
 * <p>The legacy {@code DocumentDictionary} model has been replaced by a single STI hierarchy where
 * each row is either an {@link ApplicantDocument} (profile-owned) or an {@link ApplicationDocument}
 * (application-scoped snapshot). Method names referencing "Dictionary" are kept for now to minimize
 * caller churn during the parallel migration; the return types and internals point at the new model.</p>
 */
public final class DocumentTestData {

    private DocumentTestData() {}

    /**
     * Copies a test resource into the given storage root and persists an {@link ApplicantDocument}.
     */
    public static ApplicantDocument savedApplicantDocument(
        String storageRootConfig,
        DocumentRepository documentRepository,
        User uploadedBy,
        Applicant applicant,
        DocumentType type,
        String classpathResource,
        String filename
    ) throws IOException {
        Path pdfPath = copyClasspathResource(storageRootConfig, classpathResource, filename);

        ApplicantDocument doc = new ApplicantDocument();
        doc.setApplicant(applicant);
        doc.setDocumentType(type);
        doc.setName(filename);
        doc.setPath(pdfPath.toAbsolutePath().toString());
        doc.setMimeType("application/pdf");
        doc.setSizeBytes(Files.size(pdfPath));
        doc.setUploadedBy(uploadedBy);
        return documentRepository.saveAndFlush(doc);
    }

    /**
     * Copies a test resource into the given storage root and persists an {@link ApplicationDocument}.
     */
    public static ApplicationDocument savedApplicationDocument(
        String storageRootConfig,
        DocumentRepository documentRepository,
        User uploadedBy,
        Application application,
        DocumentType type,
        String classpathResource,
        String filename
    ) throws IOException {
        Path pdfPath = copyClasspathResource(storageRootConfig, classpathResource, filename);

        ApplicationDocument doc = new ApplicationDocument();
        doc.setApplication(application);
        doc.setDocumentType(type);
        doc.setName(filename);
        doc.setPath(pdfPath.toAbsolutePath().toString());
        doc.setMimeType("application/pdf");
        doc.setSizeBytes(Files.size(pdfPath));
        doc.setUploadedBy(uploadedBy);
        return documentRepository.saveAndFlush(doc);
    }

    private static Path copyClasspathResource(String storageRootConfig, String classpathResource, String filename) throws IOException {
        Path storageRoot = Path.of(storageRootConfig).toAbsolutePath().normalize();
        Files.createDirectories(storageRoot);

        Path pdfPath = storageRoot.resolve(filename);
        try (InputStream in = DocumentTestData.class.getResourceAsStream(classpathResource)) {
            assertThat(in).as("Classpath resource should exist: " + classpathResource).isNotNull();
            Files.copy(in, pdfPath, StandardCopyOption.REPLACE_EXISTING);
        }
        return pdfPath;
    }

    /**
     * Persists a Document tied to either an Application or an Applicant (XOR), with an already-prepared path.
     *
     * <p>Returns {@link Document} (the abstract STI base) so callers may treat the result polymorphically.
     * The actual concrete type is {@link ApplicationDocument} when {@code application} is non-null, or
     * {@link ApplicantDocument} when {@code applicant} is non-null.</p>
     */
    public static Document savedDictionary(
        DocumentRepository documentRepository,
        User uploadedBy,
        String path,
        long sizeBytes,
        String mimeType,
        Application application,
        Applicant applicant,
        DocumentType type,
        String name
    ) {
        if ((application == null) == (applicant == null)) {
            throw new IllegalArgumentException("Exactly one owner must be set: application XOR applicant.");
        }
        Document doc;
        if (application != null) {
            ApplicationDocument appDoc = new ApplicationDocument();
            appDoc.setApplication(application);
            doc = appDoc;
        } else {
            ApplicantDocument applicantDoc = new ApplicantDocument();
            applicantDoc.setApplicant(applicant);
            doc = applicantDoc;
        }
        doc.setDocumentType(type);
        doc.setName(name);
        doc.setPath(path);
        doc.setMimeType(mimeType);
        doc.setSizeBytes(sizeBytes);
        doc.setUploadedBy(uploadedBy);
        return documentRepository.saveAndFlush(doc);
    }

    /**
     * Convenience method: copies the classpath resource and persists an {@link ApplicationDocument}
     * or {@link ApplicantDocument} (XOR) referring to that file.
     *
     * <p>Return type is the abstract {@link Document} base; the concrete type matches the non-null owner.</p>
     */
    public static Document savedDictionaryWithDocument(
        String storageRootConfig,
        DocumentRepository documentRepository,
        User professor,
        Application application,
        Applicant applicant,
        String classpathResource,
        String filename,
        DocumentType type,
        String name
    ) throws IOException {
        if ((application == null) == (applicant == null)) {
            throw new IllegalArgumentException("Exactly one owner must be set: application XOR applicant.");
        }
        if (application != null) {
            ApplicationDocument doc = savedApplicationDocument(
                storageRootConfig,
                documentRepository,
                professor,
                application,
                type,
                classpathResource,
                filename
            );
            // Override the name with the explicit logical name passed in.
            doc.setName(name);
            return documentRepository.saveAndFlush(doc);
        } else {
            ApplicantDocument doc = savedApplicantDocument(
                storageRootConfig,
                documentRepository,
                professor,
                applicant,
                type,
                classpathResource,
                filename
            );
            doc.setName(name);
            return documentRepository.saveAndFlush(doc);
        }
    }

    /**
     * Creates and persists a mock Document without writing an actual file to disk.
     * Useful for simple tests that don't require real file content.
     *
     * <p>Returns {@link Document} (STI base). The concrete subtype is selected by the non-null owner:
     * {@link ApplicationDocument} when {@code application} is non-null, else {@link ApplicantDocument}.</p>
     *
     * @param documentRepository repo to persist Document (new model)
     * @param uploadedBy uploader user
     * @param application linked application (XOR with applicant)
     * @param applicant linked applicant (XOR with application)
     * @param documentType document type (e.g. CV, MOTIVATION_LETTER)
     * @param fileName logical file name (e.g. "test_cv.pdf")
     */
    public static Document savedDictionaryWithMockDocument(
        DocumentRepository documentRepository,
        User uploadedBy,
        Application application,
        Applicant applicant,
        DocumentType documentType,
        String fileName
    ) {
        // Use a path inside the configured test storage root (application-test.properties: aet.storage.root=/tmp/test-storage)
        // so DocumentService.removeFileIfOrphan accepts it. Files.deleteIfExists tolerates missing files.
        Path mockPath = Path.of("/tmp/test-storage", "mock-" + fileName).toAbsolutePath().normalize();
        return savedDictionary(
            documentRepository,
            uploadedBy,
            mockPath.toString(),
            1024L,
            "application/pdf",
            application,
            applicant,
            documentType,
            fileName
        );
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
