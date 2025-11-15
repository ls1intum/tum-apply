package de.tum.cit.aet.job.service;

import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.core.service.ImageService;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Helper class for managing job images in JobService
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
     *
     * @param imageId the ID of the image to retrieve
     * @return the Image entity
     */
    public Image getImageForJob(UUID imageId) {
        return imageRepository.findById(imageId).orElseThrow(() -> new IllegalArgumentException("Image not found: " + imageId));
    }

    /**
     * Replace old job image with new one
     * This will delete the old image if it's not a default image
     *
     * @param oldImage the old image to be replaced
     * @param newImage the new image to use
     * @return the new Image entity
     */
    public Image replaceJobImage(Image oldImage, Image newImage) {
        return imageService.replaceImage(oldImage, newImage);
    }
}
