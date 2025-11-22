package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.UploadException;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
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

    private static final List<String> ALLOWED_MIME_TYPES = List.of("image/jpeg", "image/png", "image/jpg");

    private final ImageRepository imageRepository;
    private final ResearchGroupRepository researchGroupRepository;
    private final CurrentUserService currentUserService;
    private final Path imageRoot;
    private final long maxFileSize;
    private final int maxWidth;
    private final int maxHeight;

    public ImageService(
        ImageRepository imageRepository,
        ResearchGroupRepository researchGroupRepository,
        CurrentUserService currentUserService,
        @Value("${aet.storage.image-root:/storage/images}") String imageRootDir,
        @Value("${aet.storage.max-image-size-bytes:5242880}") long maxFileSize, // 5MB default
        @Value("${aet.storage.max-image-width:4096}") int maxWidth, // 4096px width default
        @Value("${aet.storage.max-image-height:4096}") int maxHeight // 4096px height default
    ) {
        this.imageRepository = imageRepository;
        this.researchGroupRepository = researchGroupRepository;
        this.currentUserService = currentUserService;
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
            throw new IllegalStateException("Cannot create image root: " + imageRoot, ioe);
        }
    }

    /**
     * Uploads an image file and stores it as a non-default image.
     * The image will be automatically associated with the current user's research group if they belong to one,
     * otherwise the research group will be null (e.g., for applicants uploading profile pictures).
     *
     * The file is validated for type (JPEG/PNG), size, and dimensions before being stored.
     * A unique filename is generated and the image is saved to the appropriate subdirectory.
     *
     * @param file      the multipart file to be uploaded
     * @param imageType the type of image (e.g., JOB_BANNER, PROFILE_PICTURE)
     * @return the persisted Image entity with metadata
     * @throws UploadException if the file is invalid or cannot be stored
     */
    @Transactional
    public Image upload(MultipartFile file, ImageType imageType) {
        User uploader = currentUserService.getUser();
        return uploadImage(file, uploader, imageType, uploader.getResearchGroup());
    }

    /**
     * Uploads a default system image for a specific school (admin only).
     * A research group ID is provided to determine which school the default image belongs to.
     *
     * The file is validated for type (JPEG/PNG), size, and dimensions before being stored.
     *
     * @param file            the multipart file to be uploaded
     * @param imageType       the type of default image (typically DEFAULT_JOB_BANNER)
     * @param researchGroupId the ID of a research group belonging to the target school
     * @return the persisted default Image entity
     * @throws AccessDeniedException if the current user is not an admin
     * @throws EntityNotFoundException if the research group is not found
     * @throws UploadException if the file is invalid or cannot be stored
     */
    @Transactional
    public Image uploadDefaultImage(MultipartFile file, ImageType imageType, UUID researchGroupId) {
        if (!currentUserService.isAdmin()) {
            throw new AccessDeniedException("Only admins can upload default images");
        }

        User uploader = currentUserService.getUser();

        ResearchGroup researchGroup = researchGroupRepository
            .findById(researchGroupId)
            .orElseThrow(() -> EntityNotFoundException.forId("ResearchGroup", researchGroupId));

        return uploadImage(file, uploader, imageType, researchGroup);
    }

    /**
     * Core upload logic shared by both regular and default image uploads.
     * Validates the file, stores it to disk, and persists the metadata to the database.
     *
     * @param file          the multipart file to be uploaded
     * @param uploader      the user uploading the image
     * @param imageType     the type of image
     * @param researchGroup the research group to associate with the image (can be null for non-default images)
     * @return the persisted Image entity
     * @throws UploadException if the file is invalid or cannot be stored
     */
    private Image uploadImage(MultipartFile file, User uploader, ImageType imageType, ResearchGroup researchGroup) {
        validateImage(file);

        try {
            // Read the image to validate it's a real image
            BufferedImage bufferedImage = ImageIO.read(file.getInputStream());
            if (bufferedImage == null) {
                throw new UploadException("Invalid image file");
            }

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

            Image image = new Image();
            image.setUrl("/images/" + relativePath);
            image.setMimeType(file.getContentType());
            image.setSizeBytes(file.getSize());
            image.setImageType(imageType);
            image.setUploadedBy(uploader);
            image.setResearchGroup(researchGroup);

            return imageRepository.save(image);
        } catch (IOException e) {
            throw new UploadException("Failed to store image", e);
        }
    }

    /**
     * Retrieves default job banner images, optionally filtered by school.
     * This method fetches images with type DEFAULT_JOB_BANNER. If a researchGroupId is provided,
     * it filters by the school that the research group belongs to (all default images for that school).
     * If null, it returns all default job banners across all schools.
     *
     * @param researchGroupId the ID of a research group (used to determine the school), or null to retrieve all default job banners
     * @return list of default job banner images for the school or all schools
     */
    public List<Image> getDefaultJobBanners(UUID researchGroupId) {
        if (researchGroupId == null) {
            return imageRepository.findDefaultJobBanners();
        }
        return imageRepository.findDefaultJobBannersByResearchGroup(researchGroupId);
    }

    /**
     * Retrieves all non-default images uploaded by the current user.
     * This excludes DEFAULT_JOB_BANNER images and returns results ordered by creation date (newest first).
     *
     * @return list of images uploaded by the current user, excluding default images
     */
    public List<Image> getMyUploadedImages() {
        UUID userId = currentUserService.getUserId();
        return imageRepository.findByUploaderId(userId);
    }

    /**
     * Retrieves all job banner images (non-default) for the current user's research group.
     * This returns only JOB_BANNER type images, excluding DEFAULT_JOB_BANNER.
     *
     * @return list of job banner images belonging to the current user's research group
     */
    public List<Image> getResearchGroupJobBanners() {
        UUID researchGroupId = currentUserService.getResearchGroupIdIfProfessor();
        List<Image> images = imageRepository.findByImageTypeAndResearchGroup(ImageType.JOB_BANNER, researchGroupId);
        return images;
    }

    /**
     * Deletes an image with ownership and permission checks.
     * Regular users can only delete images they uploaded themselves (excluding default school images).
     * For job banners (JOB_BANNER), users can delete any banner belonging to their research group.
     * Admins can delete any image, including default school images.
     *
     * The image file is deleted from the filesystem and the database record is removed.
     *
     * @param imageId the ID of the image to delete
     * @throws EntityNotFoundException if the image is not found
     * @throws AccessDeniedException if the user lacks permission to delete the image
     */
    @Transactional
    public void delete(UUID imageId) {
        User currentUser = currentUserService.getUser();
        boolean isAdmin = currentUserService.isAdmin();

        Image image = imageRepository.findById(imageId).orElseThrow(() -> EntityNotFoundException.forId("Image", imageId));

        validateDeletePermission(image, currentUser, isAdmin);

        deleteImageFile(image);
        imageRepository.delete(image);
    }

    /**
     * Validates whether the current user has permission to delete the given image.
     *
     * @param image the image to be deleted
     * @param currentUser the user attempting to delete the image
     * @param isAdmin whether the current user is an admin
     * @throws AccessDeniedException if the user lacks permission to delete the image
     */
    private void validateDeletePermission(Image image, User currentUser, boolean isAdmin) {
        if (isAdmin) {
            return; // Admins can delete any image
        }

        if (image.getImageType() == ImageType.DEFAULT_JOB_BANNER) {
            throw new AccessDeniedException("Only admins can delete default images");
        }

        if (image.getImageType() == ImageType.JOB_BANNER) {
            validateJobBannerDeletePermission(image, currentUser);
        } else {
            validateOwnershipDeletePermission(image, currentUser);
        }
    }

    /**
     * Validates whether the user can delete a job banner from their research group.
     *
     * @param image the job banner image
     * @param currentUser the user attempting to delete the image
     * @throws AccessDeniedException if the user's research group doesn't match the image's research group
     */
    private void validateJobBannerDeletePermission(Image image, User currentUser) {
        if (image.getResearchGroup() == null || currentUser.getResearchGroup() == null) {
            throw new AccessDeniedException("You do not have permission to delete this image");
        }

        if (!image.getResearchGroup().getResearchGroupId().equals(currentUser.getResearchGroup().getResearchGroupId())) {
            throw new AccessDeniedException("You can only delete job banners from your research group");
        }
    }

    /**
     * Validates whether the user is the uploader of the image.
     *
     * @param image the image
     * @param currentUser the user attempting to delete the image
     * @throws AccessDeniedException if the user is not the uploader
     */
    private void validateOwnershipDeletePermission(Image image, User currentUser) {
        if (image.getUploadedBy() != null && !image.getUploadedBy().getUserId().equals(currentUser.getUserId())) {
            throw new AccessDeniedException("You can only delete images you uploaded");
        }
    }

    /**
     * Deletes an image without ownership checks (for internal use only).
     * This method is intended for system cleanup operations and will NOT delete default school images.
     * If a default image ID is provided, the deletion is skipped and a warning is logged.
     *
     * @param imageId the ID of the image to delete
     * @throws EntityNotFoundException if the image is not found
     */
    @Transactional
    public void deleteWithoutChecks(UUID imageId) {
        Image image = imageRepository.findById(imageId).orElseThrow(() -> EntityNotFoundException.forId("Image", imageId));

        if (image.getImageType() == ImageType.DEFAULT_JOB_BANNER) {
            log.warn("Attempted to delete default image: {}", imageId);
            return;
        }

        deleteImageFile(image);
        imageRepository.delete(image);
    }

    /**
     * Replaces an old image with a new one, safely deleting the old image if appropriate.
     * This is typically used when updating a job's banner image. The old image will only be deleted if:
     * - It exists and is not null
     * - It is not a default school image (DEFAULT_JOB_BANNER)
     * - It is not a research group job banner (JOB_BANNER) - these are kept in the research group's image library
     * - It is different from the new image
     *
     * Default school images and research group job banners are never automatically deleted during replacement
     * to preserve the image library for reuse.
     *
     * @param oldImage the current image to be replaced (can be null)
     * @param newImage the new image to use (can be null)
     * @return the new image (unchanged)
     */
    public Image replaceImage(Image oldImage, Image newImage) {
        // Don't auto-delete default images or research group job banners (they're part of the reusable library)
        if (
            oldImage != null &&
            oldImage.getImageType() != ImageType.DEFAULT_JOB_BANNER &&
            oldImage.getImageType() != ImageType.JOB_BANNER &&
            (newImage == null || !oldImage.getImageId().equals(newImage.getImageId()))
        ) {
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
            Path imagePath = imageRoot.resolve(relativePath).normalize();
            Path normalizedRoot = imageRoot.normalize();

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
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
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
