package de.tum.cit.aet.core.documents.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.constants.FileExtension;
import de.tum.cit.aet.core.documents.domain.ApplicantDocument;
import de.tum.cit.aet.core.documents.domain.ApplicationDocument;
import de.tum.cit.aet.core.documents.domain.Document;
import de.tum.cit.aet.core.documents.repository.DocumentRepository;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.UploadException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.util.OptionalUtils;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.EnumSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

/**
 * Unified document service replacing the legacy {@code DocumentService} + {@code DocumentDictionaryService}.
 *
 * One row per document. {@link ApplicantDocument} rows live on the applicant profile;
 * {@link ApplicationDocument} rows are snapshot copies created when the applicant submits a job application.
 * Both reference the same hash-named file on disk; deletion removes the file only when no other row references it.
 */
@Service
public class DocumentService {

    private static final EnumSet<FileExtension> ALLOWED_EXTENSIONS = EnumSet.allOf(FileExtension.class);

    private final DocumentRepository documentRepository;
    private final CurrentUserService currentUserService;
    private final Path root;
    private final long maxFileSize;
    private final MessageDigest sha256;

    public DocumentService(
        DocumentRepository documentRepository,
        CurrentUserService currentUserService,
        @Value("${aet.storage.root:storage/docs}") String rootDir,
        @Value("${aet.storage.max-size-bytes:26214400}") long maxFileSize
    ) throws NoSuchAlgorithmException {
        this.documentRepository = documentRepository;
        this.currentUserService = currentUserService;
        this.root = Paths.get(rootDir).toAbsolutePath().normalize();
        this.maxFileSize = maxFileSize;
        this.sha256 = MessageDigest.getInstance("SHA-256");

        try {
            Files.createDirectories(root);
        } catch (IOException ioe) {
            throw new IllegalStateException("Cannot create storage root: " + root, ioe);
        }
    }

    // ---------------------------------------------------------------------
    // Upload
    // ---------------------------------------------------------------------

    /**
     * Uploads a document owned by an applicant's profile.
     */
    public ApplicantDocument uploadApplicantDocument(MultipartFile file, DocumentType type, String name, Applicant applicant) {
        StoredFile stored = storeFile(file);
        ApplicantDocument applicantDocument = new ApplicantDocument();
        populateBase(applicantDocument, stored, type, name, currentUserService.getUser());
        applicantDocument.setApplicant(applicant);
        return documentRepository.save(applicantDocument);
    }

    /**
     * Uploads a document attached directly to an application.
     */
    public ApplicationDocument uploadApplicationDocument(MultipartFile file, DocumentType type, String name, Application application) {
        StoredFile stored = storeFile(file);
        ApplicationDocument applicationDocument = new ApplicationDocument();
        populateBase(applicationDocument, stored, type, name, currentUserService.getUser());
        applicationDocument.setApplication(application);
        return documentRepository.save(applicationDocument);
    }

    /**
     * Copies all applicant-owned documents of the given types into application-scoped snapshot rows.
     * The new rows reference the same {@code path} on disk as the source applicant documents.
     */
    public List<ApplicationDocument> copyApplicantDocumentsToApplication(
        Applicant applicant,
        Application application,
        Set<DocumentType> types
    ) {
        Set<ApplicantDocument> sources = documentRepository.findAllApplicantDocuments(applicant.getUserId());
        return sources
            .stream()
            .filter(src -> types.contains(src.getDocumentType()))
            .map(src -> {
                ApplicationDocument copy = new ApplicationDocument();
                copy.setDocumentType(src.getDocumentType());
                copy.setName(src.getName());
                copy.setPath(src.getPath());
                copy.setMimeType(src.getMimeType());
                copy.setSizeBytes(src.getSizeBytes());
                copy.setUploadedBy(src.getUploadedBy());
                copy.setApplication(application);
                return documentRepository.save(copy);
            })
            .toList();
    }

    // ---------------------------------------------------------------------
    // Download
    // ---------------------------------------------------------------------

    /**
     * Downloads a document by its ID, performing access control based on owner type.
     */
    public Resource downloadDocument(UUID documentId) {
        Document document = findOrThrow(documentId);
        verifyAccess(document);
        return loadResource(document);
    }

    /**
     * Loads the underlying file resource for a document WITHOUT performing access control.
     * Intended for trusted internal callers (e.g., the export ZIP writer running as a scheduled job).
     */
    public Resource loadResourceForExport(Document document) {
        return loadResource(document);
    }

    /**
     * Resolves the file extension for the given document.
     */
    public FileExtension resolveFileExtension(Document document) {
        if (document.getMimeType() == null) {
            throw new IllegalArgumentException("Document must have a mime type");
        }
        return switch (document.getMimeType()) {
            case "application/pdf" -> FileExtension.PDF;
            default -> throw new IllegalArgumentException("Unsupported mime type: " + document.getMimeType());
        };
    }

    // ---------------------------------------------------------------------
    // Listing
    // ---------------------------------------------------------------------

    public Set<ApplicantDocument> listForApplicant(Applicant applicant) {
        return documentRepository.findAllApplicantDocuments(applicant.getUserId());
    }

    public Set<ApplicantDocument> listForApplicantByType(Applicant applicant, DocumentType type) {
        return documentRepository.findApplicantDocumentsByType(applicant.getUserId(), type);
    }

    public Set<ApplicationDocument> listForApplication(Application application) {
        return documentRepository.findAllApplicationDocuments(application.getApplicationId());
    }

    public Set<ApplicationDocument> listForApplicationByType(Application application, DocumentType type) {
        return documentRepository.findApplicationDocumentsByType(application.getApplicationId(), type);
    }

    public Document findById(UUID documentId) {
        return findOrThrow(documentId);
    }

    public ApplicantDocument saveApplicantDocument(ApplicantDocument document) {
        return documentRepository.save(document);
    }

    public ApplicationDocument saveApplicationDocument(ApplicationDocument document) {
        return documentRepository.save(document);
    }

    // ---------------------------------------------------------------------
    // Mutation: rename, delete
    // ---------------------------------------------------------------------

    public void renameApplicantDocument(UUID applicantUserId, UUID documentId, String newName) {
        ApplicantDocument applicantDocument = assertApplicantOwned(applicantUserId, documentId);
        applicantDocument.setName(newName);
        documentRepository.save(applicantDocument);
    }

    public void deleteById(UUID documentId) {
        Document document = findOrThrow(documentId);
        verifyDeletePermission(document);
        deleteRowAndOrphanedFile(document);
    }

    public void deleteApplicantOwnedDocument(UUID applicantUserId, UUID documentId) {
        ApplicantDocument applicantDocument = assertApplicantOwned(applicantUserId, documentId);
        deleteRowAndOrphanedFile(applicantDocument);
    }

    public void deleteAllByApplicantId(UUID applicantUserId) {
        Set<ApplicantDocument> applicantDocuments = documentRepository.findAllApplicantDocuments(applicantUserId);
        documentRepository.deleteAll(applicantDocuments);
        for (ApplicantDocument applicantDocument : applicantDocuments) {
            removeFileIfOrphan(applicantDocument.getPath(), applicantDocument.getDocumentId());
        }
    }

    public void deleteAllByApplicationId(UUID applicationId) {
        Set<ApplicationDocument> applicationDocuments = documentRepository.findAllApplicationDocuments(applicationId);
        documentRepository.deleteAll(applicationDocuments);
        for (ApplicationDocument applicationDocument : applicationDocuments) {
            removeFileIfOrphan(applicationDocument.getPath(), applicationDocument.getDocumentId());
        }
    }

    // ---------------------------------------------------------------------
    // Internal helpers
    // ---------------------------------------------------------------------

    private Document findOrThrow(UUID documentId) {
        return OptionalUtils.getOrThrow(documentRepository.findById(documentId), () -> EntityNotFoundException.forId("Document", documentId));
    }

    private ApplicantDocument assertApplicantOwned(UUID applicantUserId, UUID documentId) {
        Document document = findOrThrow(documentId);
        if (
            !(document instanceof ApplicantDocument applicantDocument) ||
            !applicantDocument.getApplicant().getUserId().equals(applicantUserId)
        ) {
            throw EntityNotFoundException.forId("ApplicantDocument", documentId, applicantUserId);
        }
        return applicantDocument;
    }

    private void verifyAccess(Document document) {
        if (document instanceof ApplicationDocument applicationDocument) {
            Application application = applicationDocument.getApplication();
            if (currentUserService.isProfessor() || currentUserService.isEmployee()) {
                currentUserService.verifyJobAccess(application.getJob());
                return;
            }
            currentUserService.isCurrentUserOrAdmin(application.getApplicant().getUserId());
            return;
        }
        if (document instanceof ApplicantDocument applicantDocument) {
            currentUserService.isCurrentUserOrAdmin(applicantDocument.getApplicant().getUserId());
            return;
        }
        throw new AccessDeniedException("Cannot verify access for document without owner association");
    }

    private void verifyDeletePermission(Document document) {
        if (document instanceof ApplicationDocument applicationDocument) {
            currentUserService.isCurrentUserOrAdmin(applicationDocument.getApplication().getApplicant().getUserId());
        } else if (document instanceof ApplicantDocument applicantDocument) {
            currentUserService.isCurrentUserOrAdmin(applicantDocument.getApplicant().getUserId());
        } else {
            throw new AccessDeniedException("Cannot verify delete permission for document without owner association");
        }
    }

    private void deleteRowAndOrphanedFile(Document document) {
        String path = document.getPath();
        UUID id = document.getDocumentId();
        documentRepository.delete(document);
        removeFileIfOrphan(path, id);
    }

    private void removeFileIfOrphan(String storedPath, UUID excludeId) {
        long others = documentRepository.countOtherReferencesByPath(storedPath, excludeId);
        if (others > 0) {
            return;
        }
        try {
            Files.deleteIfExists(resolveStoredPath(storedPath));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to delete orphaned document file at " + storedPath, e);
        }
    }

    private void populateBase(Document document, StoredFile stored, DocumentType type, String name, User uploader) {
        document.setDocumentType(type);
        document.setName(name);
        document.setPath(stored.path);
        document.setMimeType(stored.mimeType);
        document.setSizeBytes(stored.sizeBytes);
        document.setUploadedBy(uploader);
    }

    private StoredFile storeFile(MultipartFile file) {
        validate(file);
        try {
            FileExtension ext = parseExtension(file);
            String hash = computeFileHash(file);
            String storageFilename = hash + '.' + ext.getExtension();
            Path target = root.resolve(storageFilename);

            if (Files.notExists(target)) {
                try (InputStream in = file.getInputStream()) {
                    Files.copy(in, target);
                }
            }

            String mime = Optional.ofNullable(file.getContentType()).orElse("application/octet-stream");
            return new StoredFile(target.toString(), mime, file.getSize());
        } catch (IOException ioe) {
            throw new UploadException("Cannot store file", ioe);
        }
    }

    private Resource loadResource(Document document) {
        try {
            Path path = resolveStoredPath(document.getPath());
            Resource resource = new FileSystemResource(path);
            if (!resource.exists()) {
                throw new NoSuchFileException("Binary not found on disk: " + path);
            }
            if (!resource.isReadable()) {
                throw new NoSuchFileException("Binary not readable on disk: " + path);
            }
            return resource;
        } catch (IOException e) {
            throw new UploadException("Could not load document", e);
        }
    }

    private Path resolveStoredPath(String storedPath) {
        Path path = Paths.get(storedPath);
        if (!path.isAbsolute()) {
            if (path.getNameCount() == 1) {
                path = root.resolve(path);
            } else {
                Path workingDir = Paths.get("").toAbsolutePath();
                path = workingDir.resolve(path);
            }
        }
        path = path.toAbsolutePath().normalize();
        Path normalizedRoot = root.toAbsolutePath().normalize();
        if (!path.startsWith(normalizedRoot)) {
            throw new IllegalStateException("Stored path lies outside storage root: " + path);
        }
        return path;
    }

    private void validate(MultipartFile file) {
        if (file.isEmpty() || !StringUtils.hasText(file.getOriginalFilename())) {
            throw new UploadException("Empty file or missing filename");
        }
        if (file.getSize() > maxFileSize) {
            throw new UploadException("File exceeds maximum size of " + maxFileSize + " bytes");
        }
    }

    private FileExtension parseExtension(MultipartFile file) {
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());
        try {
            if (!StringUtils.hasText(extension)) {
                throw new UploadException("Empty file or missing extension");
            }
            FileExtension ext = FileExtension.valueOf(extension.toUpperCase());
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                throw new UploadException("File extension not allowed: ." + extension);
            }
            return ext;
        } catch (IllegalArgumentException e) {
            throw new UploadException("Unsupported file type: ." + extension);
        }
    }

    private String computeFileHash(MultipartFile file) throws IOException {
        sha256.reset();
        try (DigestInputStream in = new DigestInputStream(file.getInputStream(), sha256)) {
            in.transferTo(OutputStream.nullOutputStream());
        }
        return HexFormat.of().withLowerCase().formatHex(sha256.digest());
    }

    private record StoredFile(String path, String mimeType, long sizeBytes) {}
}
