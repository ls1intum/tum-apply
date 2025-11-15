package de.tum.cit.aet.job.service;

import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.core.service.ImageService;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Helper class for managing job images in JobService
 * 
 * Usage example in JobService:
 * 
 * When creating a job:
 * <pre>
 * public Job createJob(JobFormDTO dto) {
 *     Job job = new Job();
 *     // ... set other fields ...
 *     
 *     // Set image if provided
 *     if (dto.imageId() != null) {
 *         job.setImage(jobImageHelper.getImageForJob(dto.imageId()));
 *     }
 *     
 *     return jobRepository.save(job);
 * }
 * </pre>
 * 
 * When updating a job:
 * <pre>
 * public Job updateJob(UUID jobId, JobFormDTO dto) {
 *     Job job = jobRepository.findById(jobId).orElseThrow();
 *     // ... update other fields ...
 *     
 *     // Handle image update/replacement
 *     Image oldImage = job.getImage();
 *     Image newImage = dto.imageId() != null 
 *         ? jobImageHelper.getImageForJob(dto.imageId()) 
 *         : null;
 *     
 *     job.setImage(jobImageHelper.replaceJobImage(oldImage, newImage));
 *     
 *     return jobRepository.save(job);
 * }
 * </pre>
 */
@Component
public class JobImageHelper {

    private final ImageService imageService;
    private final ImageRepository imageRepository;

    public JobImageHelper(ImageService imageService, ImageRepository imageRepository) {
        this.imageService = imageService;
        this.imageRepository = imageRepository;
    }

    /**
     * Get an image by ID (validates it exists)
     */
    public Image getImageForJob(UUID imageId) {
        return imageRepository.findById(imageId).orElseThrow(() -> new IllegalArgumentException("Image not found: " + imageId));
    }

    /**
     * Replace old job image with new one
     * This will delete the old image if it's not a default image
     */
    public Image replaceJobImage(Image oldImage, Image newImage) {
        return imageService.replaceImage(oldImage, newImage);
    }
}
