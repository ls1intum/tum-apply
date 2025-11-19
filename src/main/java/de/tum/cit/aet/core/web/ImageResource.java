package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.dto.ImageDTO;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.security.annotations.ProfessorOrAdmin;
import de.tum.cit.aet.core.security.annotations.Public;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.ImageService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/images")
public class ImageResource {

    private final ImageService imageService;
    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;

    public ImageResource(ImageService imageService, CurrentUserService currentUserService, UserRepository userRepository) {
        this.imageService = imageService;
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
    }

    /**
     * Get all default job banner images (publicly accessible)
     * Optionally filter by school
     *
     * @param school optional school filter (e.g., CIT)
     * @return a list of default job banner images
     */
    @Public
    @GetMapping("/defaults/job-banners")
    public ResponseEntity<List<ImageDTO>> getDefaultJobBanners(@RequestParam(required = false) UUID researchGroupId) {
        List<Image> images = imageService.getDefaultJobBanners(researchGroupId);
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get all images uploaded by the current user
     *
     * @return a list of images uploaded by the current user
     */
    @ProfessorOrAdmin
    @GetMapping("/my-uploads")
    public ResponseEntity<List<ImageDTO>> getMyUploadedImages() {
        UUID userId = currentUserService.getUserId();
        List<Image> images = imageService.getImagesByUploader(userId);
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Upload a job banner image (for professors to use on their jobs)
     *
     * @param file the image file
     * @return the uploaded image DTO
     */
    @ProfessorOrAdmin
    @PostMapping(value = "/upload/job-banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageDTO> uploadJobBanner(@RequestParam("file") MultipartFile file) {
        UUID userId = currentUserService.getUserId();
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

        Image image = imageService.upload(file, user, ImageType.JOB_BANNER);
        log.info("User {} uploaded job banner image: {}", userId, image.getImageId());
        return ResponseEntity.ok(ImageDTO.fromEntity(image));
    }

    /**
     * Upload a default job banner image (admin only)
     * The image will be associated with the current user's research group
     *
     * @param file the image file
     * @return the uploaded default image DTO
     */
    @Admin
    @PostMapping(value = "/upload/default-job-banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageDTO> uploadDefaultJobBanner(@RequestParam("file") MultipartFile file) {
        User user = currentUserService.getUser();
        ResearchGroup researchGroup = user.getResearchGroup();

        if (researchGroup == null) {
            throw new IllegalArgumentException("User must belong to a research group to upload default images");
        }

        Image image = imageService.uploadDefaultImage(file, user, ImageType.DEFAULT_JOB_BANNER, researchGroup);
        return ResponseEntity.ok(ImageDTO.fromEntity(image));
    }

    /**
     * Delete an image (professors can only delete their own, admins can delete any
     * including defaults)
     *
     * @param imageId the ID of the image to delete
     * @return HTTP 204 NO CONTENT if the image is deleted successfully
     */
    @ProfessorOrAdmin
    @DeleteMapping("/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID imageId) {
        User user = currentUserService.getUser();
        boolean isAdmin = currentUserService.isAdmin();

        imageService.delete(imageId, user, isAdmin);
        return ResponseEntity.noContent().build();
    }
}
