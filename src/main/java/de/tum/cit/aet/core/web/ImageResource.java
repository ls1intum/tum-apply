package de.tum.cit.aet.core.web;

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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/images")
public class ImageResource {

    private final ImageService imageService;

    /**
     * Get all default job banner images.
     * Optionally filter by department. If a departmentId is provided, returns all
     * default images
     * for that specific department. If null, returns all default images from all
     * departments.
     *
     * @param departmentId optional department ID to filter by
     * @return a list of default job banner images (all departments if null, or one
     *         department if specified)
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/defaults/job-banners")
    public ResponseEntity<List<ImageDTO>> getDefaultJobBanners(@RequestParam(required = false) UUID departmentId) {
        log.info("GET /api/images/defaults/job-banners?departmentId={}", departmentId);
        List<? extends Image> images = imageService.getDefaultJobBanners(departmentId);
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get default job banner images for the current user's department.
     * Automatically filters by the department of the user's research group.
     *
     * @return a list of default job banner images for the current user's department
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/defaults/job-banners/for-me")
    public ResponseEntity<List<ImageDTO>> getMyDefaultJobBanners() {
        log.info("GET /api/images/defaults/job-banners/for-me");
        List<? extends Image> images = imageService.getMyDefaultJobBanners();
        List<ImageDTO> dtos = images.stream().map(ImageDTO::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get all default job banner images for a specific school.
     * Returns all default images from all departments within the school.
     *
     * @param schoolId the school ID to filter by
     * @return a list of default job banner images for the school
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/defaults/job-banners/by-school")
    public ResponseEntity<List<ImageDTO>> getDefaultJobBannersBySchool(@RequestParam UUID schoolId) {
        log.info("GET /api/images/defaults/job-banners/by-school?schoolId={}", schoolId);
        List<? extends Image> images = imageService.getDefaultJobBannersBySchool(schoolId);
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
     * (non-default images only) with isInUse flag indicating if any job uses the
     * image
     *
     * @return a list of job banner images belonging to the user's research group
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/research-group/job-banners")
    public ResponseEntity<List<ImageDTO>> getResearchGroupJobBanners() {
        log.info("GET /api/images/research-group/job-banners");
        List<? extends Image> images = imageService.getResearchGroupJobBanners();
        List<ImageDTO> dtos = imageService.toImageDTOsWithUsageInfo(images);
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
        Image image = imageService.uploadJobBanner(file);
        return ResponseEntity.status(201).body(ImageDTO.fromEntity(image));
    }

    /**
     * Upload a default job banner image for a department (admin only).
     * The image will be available to all research groups within the specified
     * department.
     *
     * @param file         the image file
     * @param departmentId the ID of the department this default image belongs to
     * @return the uploaded default image DTO
     */
    @Admin
    @PostMapping(value = "/upload/default-job-banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageDTO> uploadDefaultJobBanner(
        @RequestParam("file") MultipartFile file,
        @RequestParam("departmentId") UUID departmentId
    ) {
        log.info("POST /api/images/upload/default-job-banner filename={} departmentId={}", file.getOriginalFilename(), departmentId);
        Image image = imageService.uploadDefaultImage(file, departmentId);
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
