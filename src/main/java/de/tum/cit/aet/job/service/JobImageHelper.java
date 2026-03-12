package de.tum.cit.aet.job.service;

import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.repository.ImageRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Helper class for managing job images in JobService
 */
@Component
@RequiredArgsConstructor
public class JobImageHelper {

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
     * Job images are treated as reusable library assets, so replacing a job's image
     * only updates the reference and does not attempt to clean up the old image.
     * This also keeps legacy image records from breaking job updates.
     *
     * @param oldImage the old image to be replaced
     * @param newImage the new image to use
     * @return the new Image entity
     */
    public Image replaceJobImage(Image oldImage, Image newImage) {
        return newImage;
    }
}
