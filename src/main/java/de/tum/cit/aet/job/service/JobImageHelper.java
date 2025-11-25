package de.tum.cit.aet.job.service;

import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.core.service.ImageService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Helper class for managing job images in JobService
 */
@Component
@RequiredArgsConstructor
public class JobImageHelper {

    private final ImageService imageService;
    private final ImageRepository imageRepository;

    /**
     * Get an image by ID (validates it exists)
     *
     * @param imageId the ID of the image to retrieve
     * @return the Image entity
     * @throws EntityNotFoundException if the image is not found
     */
    public Image getImageForJob(UUID imageId) {
        return imageRepository.findById(imageId).orElseThrow(() -> EntityNotFoundException.forId("Image", imageId));
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
