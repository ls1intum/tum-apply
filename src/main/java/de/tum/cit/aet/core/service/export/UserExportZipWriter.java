package de.tum.cit.aet.core.service.export;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.dto.exportdata.UserDataExportDTO;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.core.service.ZipExportService;
import de.tum.cit.aet.core.util.FileUtil;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.zip.Deflater;
import java.util.zip.ZipOutputStream;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserExportZipWriter {

    private final ZipExportService zipExportService;
    private final ObjectMapper objectMapper;
    private final DocumentRepository documentRepository;
    private final ImageRepository imageRepository;

    @Value("${aet.data-export.root:${aet.storage.root:/data/docs}/exports}")
    private String dataExportRoot;

    @Value("${aet.storage.image-root:/storage/images}")
    private String imageRoot;

    public Path writeExport(@NonNull UUID userId, @NonNull UUID exportRequestId, @NonNull UserDataExportDTO userData) throws IOException {
        Path root = Paths.get(dataExportRoot).toAbsolutePath().normalize();
        Files.createDirectories(root);

        String fileName = "data-export-" + userId + "-" + exportRequestId + ".zip";
        Path zipPath = root.resolve(fileName);

        try (ZipOutputStream zipOut = new ZipOutputStream(new BufferedOutputStream(Files.newOutputStream(zipPath)))) {
            zipOut.setLevel(Deflater.BEST_COMPRESSION);

            zipExportService.addFileToZip(
                zipOut,
                "data_export_summary.json",
                objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(userData).getBytes()
            );

            List<Document> uploadedDocuments = documentRepository.findByUploadedByUserId(userId);
            for (Document document : uploadedDocuments) {
                String entryName = "documents/uploaded/" + document.getDocumentId();
                addDocumentToZip(zipOut, document, entryName);
            }

            List<Image> images = imageRepository.findByUploaderId(userId);
            for (Image image : images) {
                addImageToZip(zipOut, image);
            }

            zipOut.finish();
        }

        return zipPath;
    }

    private void addDocumentToZip(ZipOutputStream zipOut, @NonNull Document document, String entryPath) {
        try {
            String mimeType = document.getMimeType();
            String extension = switch (mimeType) {
                case "application/pdf" -> ".pdf";
                default -> "";
            };
            String fullEntryPath = entryPath + extension;

            zipExportService.addDocumentToZip(zipOut, fullEntryPath, document);
        } catch (Exception e) {
            throw new UserDataExportException("Failed to add document to ZIP export", e);
        }
    }

    private void addImageToZip(ZipOutputStream zipOut, Image image) {
        try {
            String relativePath = extractRelativePath(image.getUrl());
            if (relativePath == null) {
                return;
            }

            Path imagePath = resolveImagePath(relativePath);
            Path relative = Paths.get(relativePath);
            String fileName = FileUtil.sanitizeFilename(imagePath.getFileName().toString());
            String entryPath = buildEntryPath(relative, fileName);

            try (InputStream inputStream = Files.newInputStream(imagePath)) {
                zipExportService.addFileToZip(zipOut, entryPath, inputStream);
            }
        } catch (Exception e) {
            throw new UserDataExportException("Failed to add image to ZIP export", e);
        }
    }

    private String extractRelativePath(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        String relativePath = url.startsWith("/images/") ? url.substring("/images/".length()) : url;
        Path relative = Paths.get(relativePath).normalize();
        if (relative.isAbsolute() || relative.startsWith("..")) {
            throw new UserDataExportException("Invalid image path: " + relativePath);
        }

        return relativePath;
    }

    private Path resolveImagePath(String relativePath) {
        Path root = Paths.get(imageRoot).toAbsolutePath().normalize();
        Path imagePath = root.resolve(relativePath).normalize();
        if (!imagePath.startsWith(root)) {
            throw new UserDataExportException("Image path lies outside storage root: " + imagePath);
        }

        if (!Files.exists(imagePath)) {
            throw new UserDataExportException("Image file not found: " + imagePath);
        }

        return imagePath;
    }

    private String buildEntryPath(Path relative, String fileName) {
        String parentPath = relative.getParent() != null ? relative.getParent().toString().replace("\\", "/") + "/" : "";
        return "images/" + parentPath + fileName;
    }
}
