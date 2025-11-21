package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;

/**
 * Test data helper for creating Image entities in tests.
 */
public class ImageTestData {

    /**
     * Create a new Image with minimal data
     *
     * @param url        the URL of the image
     * @param imageType  the type of the image
     * @param uploadedBy the user who uploaded the image
     * @return the created Image instance
     */
    public static Image newImage(String url, ImageType imageType, User uploadedBy) {
        return newImageAll(url, imageType, "image/jpeg", 1024L, uploadedBy, null);
    }

    /**
     * Create a new Image with all fields
     *
     * @param url           the URL of the image
     * @param imageType     the type of the image
     * @param mimeType      the MIME type of the image
     * @param sizeBytes     the size of the image in bytes
     * @param uploadedBy    the user who uploaded the image
     * @param researchGroup the research group associated with the image (can be null)
     * @return the created Image instance
     */
    public static Image newImageAll(
        String url,
        ImageType imageType,
        String mimeType,
        Long sizeBytes,
        User uploadedBy,
        ResearchGroup researchGroup
    ) {
        Image image = new Image();
        image.setUrl(url);
        image.setImageType(imageType);
        image.setMimeType(mimeType);
        image.setSizeBytes(sizeBytes);
        image.setUploadedBy(uploadedBy);
        image.setResearchGroup(researchGroup);
        return image;
    }

    /**
     * Create and save a new Image with minimal data
     *
     * @param imageRepository the repository to save the image
     * @param url             the URL of the image
     * @param imageType       the type of the image
     * @param uploadedBy      the user who uploaded the image
     * @return the saved Image instance
     */
    public static Image saved(ImageRepository imageRepository, String url, ImageType imageType, User uploadedBy) {
        return imageRepository.save(newImage(url, imageType, uploadedBy));
    }

    /**
     * Create and save a new Image with all fields
     *
     * @param imageRepository the repository to save the image
     * @param url             the URL of the image
     * @param imageType       the type of the image
     * @param mimeType        the MIME type of the image
     * @param sizeBytes       the size of the image in bytes
     * @param uploadedBy      the user who uploaded the image
     * @param researchGroup   the research group associated with the image (can be null)
     * @return the saved Image instance
     */
    public static Image savedAll(
        ImageRepository imageRepository,
        String url,
        ImageType imageType,
        String mimeType,
        Long sizeBytes,
        User uploadedBy,
        ResearchGroup researchGroup
    ) {
        return imageRepository.save(newImageAll(url, imageType, mimeType, sizeBytes, uploadedBy, researchGroup));
    }

    /**
     * Create a job banner image for a research group
     *
     * @param uploadedBy    the user who uploaded the image
     * @param researchGroup the research group
     * @return the created Image instance
     */
    public static Image newJobBanner(User uploadedBy, ResearchGroup researchGroup) {
        return newImageAll(
            "/images/jobs/" + UUID.randomUUID() + ".jpg",
            ImageType.JOB_BANNER,
            "image/jpeg",
            2048L,
            uploadedBy,
            researchGroup
        );
    }

    /**
     * Create a default job banner image for a research group
     *
     * @param uploadedBy    the user who uploaded the image
     * @param researchGroup the research group
     * @return the created Image instance
     */
    public static Image newDefaultJobBanner(User uploadedBy, ResearchGroup researchGroup) {
        return newImageAll(
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            3072L,
            uploadedBy,
            researchGroup
        );
    }

    /**
     * Create a profile picture image
     *
     * @param uploadedBy the user who uploaded the image
     * @return the created Image instance
     */
    public static Image newProfilePicture(User uploadedBy) {
        return newImageAll(
            "/images/profiles/" + UUID.randomUUID() + ".jpg",
            ImageType.PROFILE_PICTURE,
            "image/jpeg",
            1536L,
            uploadedBy,
            null
        );
    }
}
