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
    private final int maxWidth;
    private final int maxHeight;

    public ImageService(
        ImageRepository imageRepository,
        @Value("${aet.storage.image-root:/storage/images}") String imageRootDir,
        @Value("${aet.storage.max-image-size-bytes:5242880}") long maxFileSize, // 5MB default
        @Value("${aet.storage.max-image-width:1920}") int maxWidth, // 1920px width default
        @Value("${aet.storage.max-image-height:1080}") int maxHeight // 1080px height default
    ) {
        this.imageRepository = imageRepository;
        this.imageRoot = Paths.get(imageRootDir).toAbsolutePath().normalize();
        this.maxFileSize = maxFileSize;
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;

        initializeImageDirectories();
    }

    private void initializeImageDirectories() {
        try {
            Files.createDirectories(imageRoot);
            // Create subdirectories for each image type
            Files.createDirectories(imageRoot.resolve("jobs"));
            Files.createDirectories(imageRoot.resolve("profiles"));
            Files.createDirectories(imageRoot.resolve("defaults"));
        } catch (IOException ioe) {
            log.warn("Cannot create image storage root: {}. Image upload functionality may be limited.", imageRoot, ioe);
        }
    }

    /**
     * Uploads an image file and stores it as a non-default image.
     *
     * @param file      the file to be uploaded
     * @param uploader  the user uploading the image
     * @param imageType the type of image
     * @return the stored image
     * @throws UploadException if the file cannot be stored
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

            // Validate image dimensions
            validateImageDimensions(bufferedImage);

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
            image.setSchool(null); // User uploaded images don't belong to a specific school

            return imageRepository.save(image);
        } catch (IOException e) {
            throw new UploadException("Failed to store image", e);
        }
    }

    /**
     * Uploads a default system image for a specific school (admin only).
     *
     * @param file      the file to be uploaded
     * @param uploader  the admin user uploading the image
     * @param imageType the type of default image
     * @param school    the school this image belongs to
     * @return the stored default image
     * @throws UploadException if the file cannot be stored
     */
    @Transactional
    public Image uploadDefaultImage(MultipartFile file, User uploader, ImageType imageType, School school) {
        if (school == null) {
            throw new IllegalArgumentException("School is required for default images");
        }
        validateImage(file);

        try {
            // Read the image to validate it's a real image
            BufferedImage bufferedImage = ImageIO.read(file.getInputStream());
            if (bufferedImage == null) {
                throw new UploadException("Invalid image file");
            }

            // Validate image dimensions
            validateImageDimensions(bufferedImage);

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
            image.setDefault(true);
            image.setUploadedBy(uploader);
            image.setSchool(school);

            return imageRepository.save(image);
        } catch (IOException e) {
            throw new UploadException("Failed to store image", e);
        }
    }

    /**
     * Retrieves all default job banner images for a specific school.
     *
     * @param school the school to filter by, or null for all schools
     * @return list of default job banner images
     */
    public List<Image> getDefaultJobBanners(School school) {
        if (school == null) {
            return imageRepository.findDefaultJobBanners();
        }
        return imageRepository.findDefaultJobBannersBySchool(school);
    }

    /**
     * Retrieves all default job banner images across all schools.
     *
     * @return list of all default job banner images
     */
    public List<Image> getDefaultJobBanners() {
        return imageRepository.findDefaultJobBanners();
    }

    /**
     * Retrieves all images uploaded by a specific user.
     *
     * @param userId the ID of the user
     * @return list of images uploaded by the user
     */
    public List<Image> getImagesByUploader(UUID userId) {
        return imageRepository.findByUploaderId(userId);
    }

    /**
     * Deletes an image with ownership checks. Admins can delete any image including
     * defaults.
     *
     * @param imageId the ID of the image to delete
     * @param user    the user requesting the deletion
     * @param isAdmin whether the user is an admin
     */
    @Transactional
    public void delete(UUID imageId, User user, boolean isAdmin) {
        Image image = imageRepository.findById(imageId).orElseThrow(() -> new IllegalArgumentException("Image not found: " + imageId));

        // Only admins can delete default images
        if (image.isDefault() && !isAdmin) {
            throw new IllegalArgumentException("Only admins can delete default images");
        }

        // Check ownership - only the uploader (or admin) can delete
        if (!isAdmin && image.getUploadedBy() != null && !image.getUploadedBy().getUserId().equals(user.getUserId())) {
            throw new IllegalArgumentException("You can only delete images you uploaded");
        }

        deleteImageFile(image);

        // Delete from database
        imageRepository.delete(image);
    }

    /**
     * Deletes an image without ownership checks (for internal use only).
     *
     * @param imageId the ID of the image to delete
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
     * Replaces an old image with a new one, deleting the old image if it's not a
     * default.
     *
     * @param oldImage the current image to be replaced
     * @param newImage the new image to use
     * @return the new image
     */
    public Image replaceImage(Image oldImage, Image newImage) {
        // If old image exists and is different from new image, delete it (but only if
        // not a default image)
        if (oldImage != null && !oldImage.isDefault() && (newImage == null || !oldImage.getImageId().equals(newImage.getImageId()))) {
            try {
                deleteWithoutChecks(oldImage.getImageId());
            } catch (Exception e) {
                log.error("Failed to delete old image during replacement: {}", oldImage.getImageId(), e);
            }
        }
        return newImage;
    }

    private void deleteImageFile(Image image) {
        try {
            String relativePath = image.getUrl().replace("/images/", "");
            Path imagePath = imageRoot.resolve(relativePath);

            if (!imagePath.isAbsolute()) {
                if (imagePath.getNameCount() == 1) {
                    imagePath = imageRoot.resolve(imagePath);
                } else {
                    Path workingDir = Paths.get("").toAbsolutePath();
                    imagePath = workingDir.resolve(imagePath);
                }
            }

            imagePath = imagePath.toAbsolutePath().normalize();
            Path normalizedRoot = imageRoot.toAbsolutePath().normalize();

            if (!imagePath.startsWith(normalizedRoot)) {
                throw new IllegalStateException("Stored path lies outside storage root: " + imagePath);
            }

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
        if (mimeType == null || !List.of("image/jpeg", "image/png", "image/jpg").contains(mimeType.toLowerCase())) {
            throw new UploadException("Invalid image type. Allowed: JPG, JPEG, PNG");
        }
    }

    private void validateImageDimensions(BufferedImage image) {
        int width = image.getWidth();
        int height = image.getHeight();

        if (width > maxWidth || height > maxHeight) {
            throw new UploadException(
                String.format("Image dimensions (%dx%d) exceed maximum allowed dimensions (%dx%d)", width, height, maxWidth, maxHeight)
            );
        }
    }

    private String getExtension(MultipartFile file) {
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());
        if (!StringUtils.hasText(extension)) {
            // Fallback based on mime type
            String mimeType = file.getContentType();
            if (mimeType != null) {
                if (mimeType.contains("jpeg") || mimeType.contains("jpg")) {
                    return ".jpg";
                }
                if (mimeType.contains("png")) {
                    return ".png";
                }
                if (mimeType.contains("webp")) {
                    return ".webp";
                }
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
