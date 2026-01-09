package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.core.domain.DepartmentImage;
import de.tum.cit.aet.core.domain.ProfileImage;
import de.tum.cit.aet.core.domain.ResearchGroupImage;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;

/**
 * Test data helper for creating Image entities in tests.
 */
public class ImageTestData {

    /**
     * Create and save a ResearchGroupImage with minimal data
     *
     * @param imageRepository the repository to save the image
     * @param url             the URL of the image
     * @param uploadedBy      the user who uploaded the image
     * @param researchGroup   the research group
     * @return the saved ResearchGroupImage instance
     */
    public static ResearchGroupImage savedResearchGroupImage(
        ImageRepository imageRepository,
        String url,
        User uploadedBy,
        ResearchGroup researchGroup
    ) {
        return imageRepository.save(newJobBanner(uploadedBy, researchGroup));
    }

    /**
     * Create and save a DepartmentImage with minimal data
     *
     * @param imageRepository the repository to save the image
     * @param url             the URL of the image
     * @param uploadedBy      the user who uploaded the image
     * @param department      the department
     * @return the saved DepartmentImage instance
     */
    public static DepartmentImage savedDepartmentImage(
        ImageRepository imageRepository,
        String url,
        User uploadedBy,
        Department department
    ) {
        return imageRepository.save(newDefaultJobBanner(uploadedBy, department));
    }

    /**
     * Create and save a ProfileImage with minimal data
     *
     * @param imageRepository the repository to save the image
     * @param url             the URL of the image
     * @param uploadedBy      the user who uploaded the image
     * @return the saved ProfileImage instance
     */
    public static ProfileImage savedProfileImage(ImageRepository imageRepository, String url, User uploadedBy) {
        return imageRepository.save(newProfilePicture(uploadedBy));
    }

    /**
     * Create a job banner image for a research group
     *
     * @param uploadedBy    the user who uploaded the image
     * @param researchGroup the research group
     * @return the created ResearchGroupImage instance
     */
    public static ResearchGroupImage newJobBanner(User uploadedBy, ResearchGroup researchGroup) {
        ResearchGroupImage image = new ResearchGroupImage();
        image.setUrl("/images/jobs/" + UUID.randomUUID() + ".jpg");
        image.setMimeType("image/jpeg");
        image.setSizeBytes(2048L);
        image.setUploadedBy(uploadedBy);
        image.setResearchGroup(researchGroup);
        return image;
    }

    /**
     * Create a default job banner image for a department
     *
     * @param uploadedBy the user who uploaded the image
     * @param department the department
     * @return the created DepartmentImage instance
     */
    public static DepartmentImage newDefaultJobBanner(User uploadedBy, Department department) {
        DepartmentImage image = new DepartmentImage();
        image.setUrl("/images/defaults/" + UUID.randomUUID() + ".jpg");
        image.setMimeType("image/jpeg");
        image.setSizeBytes(3072L);
        image.setUploadedBy(uploadedBy);
        image.setDepartment(department);
        return image;
    }

    /**
     * Create a profile picture image
     *
     * @param uploadedBy the user who uploaded the image
     * @return the created ProfileImage instance
     */
    public static ProfileImage newProfilePicture(User uploadedBy) {
        ProfileImage image = new ProfileImage();
        image.setUrl("/images/profiles/" + UUID.randomUUID() + ".jpg");
        image.setMimeType("image/jpeg");
        image.setSizeBytes(1536L);
        image.setUploadedBy(uploadedBy);
        return image;
    }
}
