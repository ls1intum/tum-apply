package de.tum.cit.aet.core.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.dto.ImageDTO;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ImageTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;

/**
 * Integration tests for {@link ImageResource}.
 * Tests all REST endpoints for image management including:
 * - Upload operations (job banners and default images)
 * - Retrieval operations (defaults, my uploads, research group images)
 * - Delete operations with access control
 * - Authentication and authorization
 */
public class ImageResourceTest extends AbstractResourceTest {

    private static final String API_BASE_PATH = "/api/images";

    @Autowired
    ImageRepository imageRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    ResearchGroup researchGroup;
    ResearchGroup secondResearchGroup;
    User professorUser;
    User secondProfessorUser;
    User adminUser;
    Image testImage;
    Image secondTestImage;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        // Create first research group and professor
        researchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Prof. Smith",
            "ML Research Group",
            "ML",
            "Munich",
            "Computer Science",
            "Machine Learning research",
            "ml@tum.de",
            "80333",
            "TUM",
            "Arcisstr. 21",
            "https://ml.tum.de",
            "ACTIVE"
        );
        professorUser = UserTestData.savedProfessor(userRepository, researchGroup);

        // Create second research group and professor
        secondResearchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Prof. Doe",
            "AI Research Group",
            "AI",
            "Munich",
            "Computer Science",
            "Artificial Intelligence research",
            "ai@tum.de",
            "80333",
            "TUM",
            "Otherstr. 10",
            "https://ai.tum.de",
            "ACTIVE"
        );
        secondProfessorUser = UserTestData.savedProfessor(userRepository, secondResearchGroup);

        // Create admin user
        adminUser = UserTestData.newUserAll(UUID.randomUUID(), "admin@tum.de", "Admin", "User");
        adminUser = userRepository.save(adminUser);

        // Create test images
        testImage = ImageTestData.savedAll(
            imageRepository,
            "/images/jobs/" + UUID.randomUUID() + ".jpg",
            ImageType.JOB_BANNER,
            "image/jpeg",
            2048L,
            professorUser,
            researchGroup
        );

        secondTestImage = ImageTestData.savedAll(
            imageRepository,
            "/images/jobs/" + UUID.randomUUID() + ".jpg",
            ImageType.JOB_BANNER,
            "image/jpeg",
            1024L,
            secondProfessorUser,
            secondResearchGroup
        );
    }

    // --- GET /api/images/defaults/job-banners (getDefaultJobBanners) ---

    @Test
    void getDefaultJobBannersReturnsAllDefaultImagesWhenNoFilterProvided() {
        // Arrange
        Image defaultImage1 = ImageTestData.savedAll(
            imageRepository,
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            3072L,
            adminUser,
            researchGroup
        );
        Image defaultImage2 = ImageTestData.savedAll(
            imageRepository,
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            2560L,
            adminUser,
            secondResearchGroup
        );

        // Act
        List<ImageDTO> result = api.getAndRead(
            API_BASE_PATH + "/defaults/job-banners",
            Map.of(),
            new TypeReference<List<ImageDTO>>() {},
            200
        );

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        assertThat(result).anyMatch(img -> img.imageId().equals(defaultImage1.getImageId()));
        assertThat(result).anyMatch(img -> img.imageId().equals(defaultImage2.getImageId()));
    }

    @Test
    void getDefaultJobBannersFiltersByResearchGroupWhenIdProvided() {
        // Arrange - Set same school for both research groups so they share defaults
        researchGroup.setSchool("CS");
        secondResearchGroup.setSchool("EE");
        researchGroupRepository.save(researchGroup);
        researchGroupRepository.save(secondResearchGroup);

        Image defaultImageCS = ImageTestData.savedAll(
            imageRepository,
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            3072L,
            adminUser,
            researchGroup
        );
        // Create default image for EE school (needed for test setup, but not used in assertion)
        ImageTestData.savedAll(
            imageRepository,
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            2560L,
            adminUser,
            secondResearchGroup
        );

        // Act - Filter by first research group
        List<ImageDTO> result = api.getAndRead(
            API_BASE_PATH + "/defaults/job-banners",
            Map.of("researchGroupId", researchGroup.getResearchGroupId().toString()),
            new TypeReference<List<ImageDTO>>() {},
            200
        );

        // Assert - Should only return default images from the same school (CS)
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).imageId()).isEqualTo(defaultImageCS.getImageId());
    }

    @Test
    void getDefaultJobBannersIsPubliclyAccessible() {
        // Arrange
        Image defaultImage = ImageTestData.savedAll(
            imageRepository,
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            3072L,
            adminUser,
            researchGroup
        );

        // Act - No authentication
        List<ImageDTO> result = api
            .withoutPostProcessors()
            .getAndRead(API_BASE_PATH + "/defaults/job-banners", Map.of(), new TypeReference<List<ImageDTO>>() {}, 200);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).imageId()).isEqualTo(defaultImage.getImageId());
    }

    // --- GET /api/images/my-uploads (getMyUploadedImages) ---

    @Test
    void getMyUploadedImagesReturnsOnlyCurrentUserImages() {
        // Arrange - Add profile picture for professor
        Image profileImage = ImageTestData.savedAll(
            imageRepository,
            "/images/profiles/" + UUID.randomUUID() + ".jpg",
            ImageType.PROFILE_PICTURE,
            "image/jpeg",
            1536L,
            professorUser,
            null
        );

        // Act
        List<ImageDTO> result = api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(API_BASE_PATH + "/my-uploads", Map.of(), new TypeReference<List<ImageDTO>>() {}, 200);

        // Assert
        assertThat(result).isNotNull();
        // Should include job banner and profile picture, but not default images
        assertThat(result).hasSizeGreaterThanOrEqualTo(2);
        assertThat(result).anyMatch(img -> img.imageId().equals(testImage.getImageId()));
        assertThat(result).anyMatch(img -> img.imageId().equals(profileImage.getImageId()));
        assertThat(result).noneMatch(img -> img.imageId().equals(secondTestImage.getImageId()));
    }

    @Test
    void getMyUploadedImagesDoesNotIncludeDefaultImages() {
        // Arrange
        Image defaultImage = ImageTestData.savedAll(
            imageRepository,
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            3072L,
            professorUser,
            researchGroup
        );

        // Act
        List<ImageDTO> result = api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(API_BASE_PATH + "/my-uploads", Map.of(), new TypeReference<List<ImageDTO>>() {}, 200);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).noneMatch(img -> img.imageId().equals(defaultImage.getImageId()));
        assertThat(result).noneMatch(img -> img.imageType() == ImageType.DEFAULT_JOB_BANNER);
    }

    @Test
    void getMyUploadedImagesRequiresAuthentication() {
        // Act & Assert
        api.withoutPostProcessors().getAndRead(API_BASE_PATH + "/my-uploads", Map.of(), Void.class, 403);
    }

    // --- GET /api/images/research-group/job-banners (getResearchGroupJobBanners) ---

    @Test
    void getResearchGroupJobBannersReturnsOnlyGroupImages() {
        // Act
        List<ImageDTO> result = api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(API_BASE_PATH + "/research-group/job-banners", Map.of(), new TypeReference<List<ImageDTO>>() {}, 200);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).imageId()).isEqualTo(testImage.getImageId());
        assertThat(result.get(0).researchGroupId()).isEqualTo(researchGroup.getResearchGroupId());
    }

    @Test
    void getResearchGroupJobBannersDoesNotIncludeOtherGroupsImages() {
        // Act
        List<ImageDTO> result = api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(API_BASE_PATH + "/research-group/job-banners", Map.of(), new TypeReference<List<ImageDTO>>() {}, 200);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).noneMatch(img -> img.imageId().equals(secondTestImage.getImageId()));
    }

    @Test
    void getResearchGroupJobBannersRequiresAuthentication() {
        // Act & Assert
        api.withoutPostProcessors().getAndRead(API_BASE_PATH + "/research-group/job-banners", Map.of(), Void.class, 403);
    }

    // --- POST /api/images/upload/job-banner (uploadJobBanner) ---

    @Test
    void uploadJobBannerSuccessfullyUploadsValidImage() throws Exception {
        // Arrange
        MockMultipartFile validImageFile = createValidImageFile("test-banner.jpg");

        // Act
        ImageDTO result = api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .multipartPostAndRead(API_BASE_PATH + "/upload/job-banner", List.of(validImageFile), new TypeReference<ImageDTO>() {}, 201);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.imageId()).isNotNull();
        assertThat(result.imageType()).isEqualTo(ImageType.JOB_BANNER);
        assertThat(result.uploadedById()).isEqualTo(professorUser.getUserId());
        assertThat(result.researchGroupId()).isEqualTo(researchGroup.getResearchGroupId());

        // Verify image was saved to database
        Image savedImage = imageRepository.findById(result.imageId()).orElse(null);
        assertThat(savedImage).isNotNull();
        assertThat(savedImage.getImageType()).isEqualTo(ImageType.JOB_BANNER);
    }

    @Test
    void uploadJobBannerRejectsInvalidImageType() throws Exception {
        // Arrange - Create a non-image file
        MockMultipartFile invalidFile = new MockMultipartFile("file", "test.gif", "image/gif", "fake image content".getBytes());

        // Act & Assert
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .multipartPostAndRead(API_BASE_PATH + "/upload/job-banner", List.of(invalidFile), new TypeReference<ImageDTO>() {}, 400);
    }

    @Test
    void uploadJobBannerRejectsEmptyFile() {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);

        // Act & Assert
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .multipartPostAndRead(API_BASE_PATH + "/upload/job-banner", List.of(emptyFile), new TypeReference<ImageDTO>() {}, 400);
    }

    @Test
    void uploadJobBannerRequiresAuthentication() throws Exception {
        // Arrange
        MockMultipartFile validImageFile = createValidImageFile("test.jpg");

        // Act & Assert
        api.withoutPostProcessors().multipartPostAndRead(API_BASE_PATH + "/upload/job-banner", List.of(validImageFile), new TypeReference<ImageDTO>() {}, 403);
    }

    // --- POST /api/images/upload/default-job-banner (uploadDefaultJobBanner) ---

    @Test
    void uploadDefaultJobBannerSuccessfullyUploadsAsAdmin() throws Exception {
        // Arrange
        MockMultipartFile validImageFile = createValidImageFile("default-banner.jpg");
        String url = API_BASE_PATH + "/upload/default-job-banner?researchGroupId=" + researchGroup.getResearchGroupId();

        // Act
        ImageDTO result = api
            .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
            .multipartPostAndRead(url, List.of(validImageFile), new TypeReference<ImageDTO>() {}, 201);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.imageId()).isNotNull();
        assertThat(result.imageType()).isEqualTo(ImageType.DEFAULT_JOB_BANNER);
        assertThat(result.uploadedById()).isEqualTo(adminUser.getUserId());
        assertThat(result.researchGroupId()).isEqualTo(researchGroup.getResearchGroupId());

        // Verify image was saved to database
        Image savedImage = imageRepository.findById(result.imageId()).orElse(null);
        assertThat(savedImage).isNotNull();
        assertThat(savedImage.getImageType()).isEqualTo(ImageType.DEFAULT_JOB_BANNER);
    }

    @Test
    void uploadDefaultJobBannerRequiresAdminRole() throws Exception {
        // Arrange
        MockMultipartFile validImageFile = createValidImageFile("default-banner.jpg");
        String url = API_BASE_PATH + "/upload/default-job-banner?researchGroupId=" + researchGroup.getResearchGroupId();

        // Act & Assert - Professor trying to upload default image
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .multipartPostAndRead(url, List.of(validImageFile), new TypeReference<ImageDTO>() {}, 403);
    }

    @Test
    void uploadDefaultJobBannerRequiresValidResearchGroupId() throws Exception {
        // Arrange
        MockMultipartFile validImageFile = createValidImageFile("default-banner.jpg");
        UUID nonExistentId = UUID.randomUUID();
        String url = API_BASE_PATH + "/upload/default-job-banner?researchGroupId=" + nonExistentId;

        // Act & Assert
        api
            .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
            .multipartPostAndRead(url, List.of(validImageFile), new TypeReference<ImageDTO>() {}, 404);
    }

    // --- DELETE /api/images/{imageId} (deleteImage) ---

    @Test
    void deleteImageSuccessfullyDeletesOwnImage() {
        // Act
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .deleteAndRead(API_BASE_PATH + "/" + testImage.getImageId(), null, Void.class, 204);

        // Assert - Verify image was deleted from database
        assertThat(imageRepository.findById(testImage.getImageId())).isEmpty();
    }

    @Test
    void deleteImageAllowsProfessorToDeleteJobBannerFromTheirResearchGroup() {
        // Arrange - Create another user in the same research group
        User anotherProfessor = UserTestData.savedProfessor(userRepository, researchGroup);
        Image jobBannerFromOther = ImageTestData.savedAll(
            imageRepository,
            "/images/jobs/" + UUID.randomUUID() + ".jpg",
            ImageType.JOB_BANNER,
            "image/jpeg",
            2048L,
            anotherProfessor,
            researchGroup
        );

        // Act - Original professor deletes image uploaded by another professor in same group
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .deleteAndRead(API_BASE_PATH + "/" + jobBannerFromOther.getImageId(), null, Void.class, 204);

        // Assert
        assertThat(imageRepository.findById(jobBannerFromOther.getImageId())).isEmpty();
    }

    @Test
    void deleteImagePreventsNonAdminFromDeletingDefaultImage() {
        // Arrange
        Image defaultImage = ImageTestData.savedAll(
            imageRepository,
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            3072L,
            adminUser,
            researchGroup
        );

        // Act & Assert
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .deleteAndRead(API_BASE_PATH + "/" + defaultImage.getImageId(), null, Void.class, 403);

        // Verify image was not deleted
        assertThat(imageRepository.findById(defaultImage.getImageId())).isPresent();
    }

    @Test
    void deleteImageAllowsAdminToDeleteAnyImage() {
        // Arrange
        Image defaultImage = ImageTestData.savedAll(
            imageRepository,
            "/images/defaults/" + UUID.randomUUID() + ".jpg",
            ImageType.DEFAULT_JOB_BANNER,
            "image/jpeg",
            3072L,
            adminUser,
            researchGroup
        );

        // Act
        api
            .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
            .deleteAndRead(API_BASE_PATH + "/" + defaultImage.getImageId(), null, Void.class, 204);

        // Assert
        assertThat(imageRepository.findById(defaultImage.getImageId())).isEmpty();
    }

    @Test
    void deleteImagePreventsUserFromDeletingOthersProfilePicture() {
        // Arrange
        Image otherUserImage = ImageTestData.savedAll(
            imageRepository,
            "/images/profiles/" + UUID.randomUUID() + ".jpg",
            ImageType.PROFILE_PICTURE,
            "image/jpeg",
            1536L,
            secondProfessorUser,
            null
        );

        // Act & Assert
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .deleteAndRead(API_BASE_PATH + "/" + otherUserImage.getImageId(), null, Void.class, 403);

        // Verify image was not deleted
        assertThat(imageRepository.findById(otherUserImage.getImageId())).isPresent();
    }

    @Test
    void deleteImagePreventsUserFromDeletingJobBannerFromDifferentResearchGroup() {
        // Act & Assert - Professor from first group tries to delete image from second group
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .deleteAndRead(API_BASE_PATH + "/" + secondTestImage.getImageId(), null, Void.class, 403);

        // Verify image was not deleted
        assertThat(imageRepository.findById(secondTestImage.getImageId())).isPresent();
    }

    @Test
    void deleteImageReturns404WhenImageNotFound() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();

        // Act & Assert
        api
            .with(JwtPostProcessors.jwtUser(professorUser.getUserId(), "ROLE_PROFESSOR"))
            .deleteAndRead(API_BASE_PATH + "/" + nonExistentId, null, Void.class, 404);
    }

    @Test
    void deleteImageRequiresAuthentication() {
        // Act & Assert
        api.withoutPostProcessors().deleteAndRead(API_BASE_PATH + "/" + testImage.getImageId(), null, Void.class, 403);
    }

    // --- Helper methods ---

    /**
     * Creates a valid test image file as a MockMultipartFile
     */
    private MockMultipartFile createValidImageFile(String filename) throws Exception {
        // Create a simple 100x100 image
        BufferedImage image = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        byte[] imageBytes = baos.toByteArray();

        return new MockMultipartFile("file", filename, "image/jpeg", imageBytes);
    }
}
