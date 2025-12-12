package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.dto.ImageDTO;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.security.annotations.ProfessorOrAdmin;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployeeOrAdmin;
import de.tum.cit.aet.core.service.ImageService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/images")
public class ImageResource {

    private final ImageService imageService;

    /**
     * Get all default job banner images
     * Optionally filter by school. If a researchGroupId is provided, returns all default images
     * for the school that the research group belongs to.
     *
     * @param researchGroupId optional research group ID (used to determine the school to filter by)
     * @return a list of default job banner images (all schools if null, or all images for one school)
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/defaults/job-banners")
    public ResponseEntity<List<ImageDTO>> getDefaultJobBanners(@RequestParam(required = false) UUID researchGroupId) {
        log.info("GET /api/images/defaults/job-banners?researchGroupId={}", researchGroupId);
        List<Image> images = imageService.getDefaultJobBanners(researchGroupId);
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get all images uploaded by the current user
     *
     * @return a list of images uploaded by the current user
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/my-uploads")
    public ResponseEntity<List<ImageDTO>> getMyUploadedImages() {
        log.info("GET /api/images/my-uploads");
        List<Image> images = imageService.getMyUploadedImages();
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get all job banner images for the current user's research group
     * (non-default images only)
     *
     * @return a list of job banner images belonging to the user's research group
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/research-group/job-banners")
    public ResponseEntity<List<ImageDTO>> getResearchGroupJobBanners() {
        log.info("GET /api/images/research-group/job-banners");
        List<Image> images = imageService.getResearchGroupJobBanners();
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Upload a job banner image (for professors to use on their jobs)
     *
     * @param file the image file
     * @return the uploaded image DTO
     */
    @ProfessorOrEmployeeOrAdmin
    @PostMapping(value = "/upload/job-banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageDTO> uploadJobBanner(@RequestParam("file") MultipartFile file) {
        log.info("POST /api/images/upload/job-banner filename={}", file.getOriginalFilename());
        Image image = imageService.upload(file, ImageType.JOB_BANNER);
        return ResponseEntity.status(201).body(ImageDTO.fromEntity(image));
    }

    /**
     * Upload a default job banner image for a school (admin only)
     * The image will be associated with the school that the specified research group belongs to.
     *
     * @param file            the image file
     * @param researchGroupId the ID of a research group belonging to the target school
     * @return the uploaded default image DTO
     */
    @Admin
    @PostMapping(value = "/upload/default-job-banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageDTO> uploadDefaultJobBanner(
        @RequestParam("file") MultipartFile file,
        @RequestParam("researchGroupId") UUID researchGroupId
    ) {
        log.info("POST /api/images/upload/default-job-banner filename={} researchGroupId={}", file.getOriginalFilename(), researchGroupId);
        Image image = imageService.uploadDefaultImage(file, ImageType.DEFAULT_JOB_BANNER, researchGroupId);
        return ResponseEntity.status(201).body(ImageDTO.fromEntity(image));
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
        log.info("DELETE /api/images/{}", imageId);
        imageService.delete(imageId);
        return ResponseEntity.noContent().build();
    }
}
