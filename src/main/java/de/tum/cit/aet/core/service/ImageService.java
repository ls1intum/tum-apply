package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.constants.School;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.exception.UploadException;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class ImageService {

    private final ImageRepository imageRepository;
    private final Path imageRoot;
    private final long maxFileSize;

    public ImageService(
        ImageRepository imageRepository,
        @Value("${aet.storage.image-root:/data/images}") String imageRootDir,
        @Value("${aet.storage.max-image-size-bytes:5242880}") long maxFileSize // 5MB default
    ) {
        this.imageRepository = imageRepository;
        this.imageRoot = Paths.get(imageRootDir).toAbsolutePath().normalize();
        this.maxFileSize = maxFileSize;

        try {
            Files.createDirectories(imageRoot);
            // Create subdirectories for each image type
            Files.createDirectories(imageRoot.resolve("jobs"));
            Files.createDirectories(imageRoot.resolve("profiles"));
            Files.createDirectories(imageRoot.resolve("defaults"));
        } catch (IOException ioe) {
            throw new IllegalStateException("Cannot create image storage root: " + imageRoot, ioe);
        }
    }

    /**
     * Upload an image file
     */
    @Transactional
    public Image upload(MultipartFile file, User uploader, ImageType imageType) {
        validateImage(file);

        try {
            // Read the image to validate it's a real image
            BufferedImage bufferedImage = ImageIO.read(file.getInputStream());
            if (bufferedImage == null) {
                throw new UploadException("Invalid image file");
            }

            // Generate unique filename
            String extension = getExtension(file);
            String filename = UUID.randomUUID() + extension;
            String subdirectory = getSubdirectory(imageType);
            String relativePath = subdirectory + "/" + filename;

            // Full path on disk
            Path fullPath = imageRoot.resolve(relativePath);

            // Save original image
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, fullPath, StandardCopyOption.REPLACE_EXISTING);
            }

            // Create entity
            Image image = new Image();
            image.setUrl("/images/" + relativePath);
            image.setMimeType(file.getContentType());
            image.setSizeBytes(file.getSize());
            image.setImageType(imageType);
            image.setDefault(false);
            image.setUploadedBy(uploader);

            return imageRepository.save(image);
        } catch (IOException e) {
            throw new UploadException("Failed to store image", e);
        }
    }

    /**
     * Get all default job banner images for a specific school
     */
    public List<Image> getDefaultJobBanners(School school) {
        if (school == null) {
            return imageRepository.findDefaultJobBanners();
        }
        return imageRepository.findDefaultJobBannersBySchool(school);
    }

    /**
     * Get all default job banner images (all schools)
     */
    public List<Image> getDefaultJobBanners() {
        return imageRepository.findDefaultJobBanners();
    }

    /**
     * Get all images uploaded by a specific user
     */
    public List<Image> getImagesByUploader(UUID userId) {
        return imageRepository.findByUploaderId(userId);
    }

    /**
     * Delete an image (checks ownership)
     */
    @Transactional
    public void delete(UUID imageId, User user) {
        Image image = imageRepository.findById(imageId).orElseThrow(() -> new IllegalArgumentException("Image not found: " + imageId));

        // Don't delete default images
        if (image.isDefault()) {
            throw new IllegalArgumentException("Cannot delete default images");
        }

        // Check ownership - only the uploader can delete
        if (image.getUploadedBy() != null && !image.getUploadedBy().getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("You can only delete images you uploaded");
        }

        deleteImageFile(image);

        // Delete from database
        imageRepository.delete(image);
    }

    /**
     * Delete an image without ownership checks (for internal use, e.g., when job is deleted)
     */
    @Transactional
    public void deleteWithoutChecks(UUID imageId) {
        Image image = imageRepository.findById(imageId).orElseThrow(() -> new IllegalArgumentException("Image not found: " + imageId));

        // Don't delete default images
        if (image.isDefault()) {
            log.warn("Attempted to delete default image: {}", imageId);
            return;
        }

        deleteImageFile(image);
        imageRepository.delete(image);
    }

    /**
     * Replace an old image with a new one (e.g., when updating a job)
     *
     * @param oldImage the current image to be replaced (can be null)
     * @param newImage the new image to use (can be null)
     * @return the new image to set
     */
    public Image replaceImage(Image oldImage, Image newImage) {
        // If old image exists and is different from new image, delete it
        if (oldImage != null && (newImage == null || !oldImage.getImageId().equals(newImage.getImageId()))) {
            // Only delete if not a default image
            if (!oldImage.isDefault()) {
                try {
                    deleteWithoutChecks(oldImage.getImageId());
                    log.info("Replaced old image: {} with new image: {}", oldImage.getImageId(), newImage != null ? newImage.getImageId() : "null");
                } catch (Exception e) {
                    log.error("Failed to delete old image during replacement: {}", oldImage.getImageId(), e);
                }
            }
        }
        return newImage;
    }

    /**
     * Delete image file from disk
     */
    private void deleteImageFile(Image image) {
        try {
            String relativePath = image.getUrl().replace("/images/", "");
            Path imagePath = imageRoot.resolve(relativePath);
            Files.deleteIfExists(imagePath);
        } catch (IOException e) {
            log.error("Failed to delete image file for: {}", image.getImageId(), e);
        }
    }

    private void validateImage(MultipartFile file) {
        if (file.isEmpty() || !StringUtils.hasText(file.getOriginalFilename())) {
            throw new UploadException("Empty file or missing filename");
        }

        if (file.getSize() > maxFileSize) {
            throw new UploadException("Image exceeds maximum size of " + maxFileSize + " bytes");
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !List.of("image/jpeg", "image/png", "image/jpg", "image/webp").contains(mimeType.toLowerCase())) {
            throw new UploadException("Invalid image type. Allowed: JPEG, PNG, WebP");
        }
    }

    private String getExtension(MultipartFile file) {
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());
        if (!StringUtils.hasText(extension)) {
            // Fallback based on mime type
            String mimeType = file.getContentType();
            if (mimeType != null) {
                if (mimeType.contains("jpeg") || mimeType.contains("jpg")) return ".jpg";
                if (mimeType.contains("png")) return ".png";
                if (mimeType.contains("webp")) return ".webp";
            }
            return ".jpg";
        }
        return "." + extension.toLowerCase();
    }

    private String getSubdirectory(ImageType imageType) {
        return switch (imageType) {
            case JOB_BANNER -> "jobs";
            case PROFILE_PICTURE -> "profiles";
            case DEFAULT_JOB_BANNER -> "defaults";
        };
    }
}
