package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.FileExtension;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.exception.UploadException;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
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
import java.util.*;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

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

    public FileStorageService(
        DocumentRepository documentRepository,
        @Value("${aet.storage.root:/data/docs}") String rootDir,
        @Value("${aet.storage.max-size-bytes:26214400}") long maxFileSize
    ) throws NoSuchAlgorithmException {
        this.documentRepository = documentRepository;
        this.root = Paths.get(rootDir);
        this.maxFileSize = maxFileSize;
        this.sha256 = MessageDigest.getInstance("SHA-256");

        // Ensure root exists once at startup
        try {
            Files.createDirectories(root);
        } catch (IOException ioe) {
            throw new IllegalStateException("Cannot create storage root: " + root, ioe);
        }
    }

    /**
     * Stores the binary, creates or re-uses the Document row, and returns it.
     *
     * @throws UploadException for business-rule violations
     * @throws IOException     for low-level I/O errors
     */
    public Document store(MultipartFile file, Applicant applicant) throws IOException {
        validate(file);

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
            .findById(hash)
            .orElseGet(() -> {
                String mime = Optional.ofNullable(file.getContentType()).orElse("application/octet-stream");
                Document doc = new Document();
                doc.setSha256Id(hash);
                doc.setPath(path.toString());
                doc.setMimeType(mime);
                doc.setSizeBytes(file.getSize());
                return documentRepository.save(doc);
            });
    }

    public List<Document> store(List<MultipartFile> files, Applicant applicant) throws IOException {
        List<Document> documents = new ArrayList<>(files.size());
        for (MultipartFile file : files) {
            documents.add(store(file, applicant));
        }
        return documents;
    }

    /**
     * Return a single document as a {@link Resource} that the caller can
     * stream or copy. The SHA-256 (primary key) is the lookup key.
     *
     * @throws NoSuchFileException if the DB row exists but the binary is gone
     * @throws UploadException     if the ID is unknown
     */
    public Resource load(String sha256) throws IOException {
        Document document = documentRepository.findById(sha256).orElseThrow(() -> new UploadException("Document not found"));

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

    /**
     * Convenience overload: load several files by their SHA-256 ids.
     * Order of resources matches order of ids supplied.
     */
    public List<Resource> load(List<String> sha256List) throws IOException {
        List<Resource> resources = new ArrayList<>(sha256List.size());
        for (String sha256 : sha256List) {
            resources.add(load(sha256));
        }
        return resources;
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
            FileExtension ext = FileExtension.valueOf(extension);
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
            // drain the stream into a black hole
            in.transferTo(OutputStream.nullOutputStream());
        }

        return HexFormat.of().withLowerCase().formatHex(sha256.digest());
    }
}
