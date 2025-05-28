package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.FileExtension;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.exception.UploadException;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.EnumSet;
import java.util.HexFormat;
import java.util.Optional;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;

    @Value("${aet.storage.root}")
    private Path root;

    /**
     * default 25 MiB
     */
    @Value("${aet.storage.max-size-bytes:26214400}")
    private long maxFileSize;

    private final MessageDigest sha256;

    private static final EnumSet<FileExtension> ALLOWED_EXTENSIONS = EnumSet.allOf(FileExtension.class);

    public DocumentService(
        DocumentRepository documentRepository,
        @Value("${aet.storage.root:/data/docs}") String rootDir,
        @Value("${aet.storage.max-size-bytes:26214400}") long maxFileSize
    ) throws NoSuchAlgorithmException {
        this.documentRepository = documentRepository;
        this.root = Paths.get(rootDir).toAbsolutePath().normalize();
        this.maxFileSize = maxFileSize;
        this.sha256 = MessageDigest.getInstance("SHA-256");

        try {
            Files.createDirectories(root);
        } catch (IOException ioe) {
            throw new IllegalStateException("Cannot create storage root: " + root, ioe);
        }
    }

    /**
     * Uploads a file and stores it as a document.
     *
     * @param multipartFile the file to be uploaded
     * @param user the user uploading the file
     * @return the stored document
     * @throws UploadException if the file cannot be stored
     */
    public Document upload(MultipartFile multipartFile, User user) {
        validate(multipartFile);
        try {
            return store(multipartFile, user);
        } catch (IOException ioe) {
            throw new UploadException("Cannot store file", ioe);
        }
    }

    /**
     * Stores the binary, creates or re-uses the Document row, and returns it.
     *
     * @throws UploadException for business-rule violations
     * @throws IOException     for low-level I/O errors
     */
    private Document store(MultipartFile file, User user) throws IOException {
        FileExtension ext = parseExtension(file);
        String hash = computeFileHash(file);
        String storageFilename = hash + '.' + ext.getExtension();

        Path path = root.resolve(storageFilename);

        // Only copy if the physical file is new
        if (Files.notExists(path)) {
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, path);
            }
        }

        // Either insert new Document or reuse existing row
        return documentRepository
            .findBySha256Id(hash)
            .orElseGet(() -> {
                String mime = Optional.ofNullable(file.getContentType()).orElse("application/octet-stream");
                Document doc = new Document();
                doc.setSha256Id(hash);
                doc.setPath(path.toString());
                doc.setMimeType(mime);
                doc.setSizeBytes(file.getSize());
                doc.setUploadedBy(user);
                return documentRepository.save(doc);
            });
    }

    /**
     * Downloads the given document as a resource.
     *
     * @param document the document to be downloaded
     * @return the resource representing the downloaded document
     * @throws UploadException if the document cannot be loaded
     */
    public Resource download(Document document) {
        try {
            return load(document);
        } catch (IOException e) {
            throw new UploadException("Could not load document", e);
        }
    }

    /**
     * Return a single document as a {@link Resource} that the caller can
     * stream or copy. The SHA-256 (primary key) is the lookup key.
     *
     * @throws NoSuchFileException if the DB row exists but the binary is gone
     * @throws UploadException     if the ID is unknown
     */
    private Resource load(Document document) throws IOException {
        Path path = Paths.get(document.getPath()).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalStateException("Stored path lies outside storage root: " + path);
        }

        Resource resource = new PathResource(path);
        if (!resource.exists() || !resource.isReadable()) {
            throw new NoSuchFileException("Binary not found on disk: " + path);
        }
        return resource;
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

    /**
     * Streams the file through SHA-256 to avoid loading it entirely in memory.
     */
    private String computeFileHash(MultipartFile file) throws IOException {
        sha256.reset();

        try (DigestInputStream in = new DigestInputStream(file.getInputStream(), sha256)) {
            in.transferTo(OutputStream.nullOutputStream());
        }
        return HexFormat.of().withLowerCase().formatHex(sha256.digest());
    }
}
