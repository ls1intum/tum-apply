package de.tum.cit.aet.core.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.core.constants.ImageType;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.UploadException;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.utility.testdata.ImageTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class ImageServiceTest {

    @Mock
    private ImageRepository imageRepository;

    @Mock
    private ResearchGroupRepository researchGroupRepository;

    @Mock
    private CurrentUserService currentUserService;

    private ImageService imageService;

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final UUID TEST_RESEARCH_GROUP_ID = UUID.randomUUID();
    private static final UUID TEST_IMAGE_ID = UUID.randomUUID();
    private static final String IMAGE_ROOT = "/tmp/test-images";
    private static final long MAX_FILE_SIZE = 5242880L; // 5MB
    private static final int MAX_WIDTH = 4096;
    private static final int MAX_HEIGHT = 4096;

    private User testUser;
    private ResearchGroup testResearchGroup;

    @BeforeEach
    void setUp() {
        imageService = new ImageService(
            imageRepository,
            researchGroupRepository,
            currentUserService,
            IMAGE_ROOT,
            MAX_FILE_SIZE,
            MAX_WIDTH,
            MAX_HEIGHT
        );

        // Initialize test research group
        testResearchGroup = ResearchGroupTestData.newRgAll(
            "Prof. Test",
            "Test Research Group",
            "TRG",
            "Munich",
            "Computer Science",
            "Test description",
            "test@research.com",
            "12345",
            "Test University",
            "Test Street",
            "https://test.com",
            "ACTIVE"
        );
        testResearchGroup.setResearchGroupId(TEST_RESEARCH_GROUP_ID);

        // Initialize test user
        testUser = UserTestData.newUserAll(TEST_USER_ID, "test@example.com", "Test", "User");
        testUser.setResearchGroup(testResearchGroup);
    }

    @Nested
    class Upload {

        @Test
        void shouldThrowExceptionWhenFileIsEmpty() {
            // Arrange
            MultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]);
            when(currentUserService.getUser()).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> imageService.upload(emptyFile, ImageType.JOB_BANNER))
                .isInstanceOf(UploadException.class)
                .hasMessageContaining("Empty file");
        }

        @Test
        void shouldThrowExceptionWhenFileExceedsMaxSize() {
            // Arrange
            byte[] largeContent = new byte[(int) (MAX_FILE_SIZE + 1)];
            MultipartFile largeFile = new MockMultipartFile("file", "large.jpg", "image/jpeg", largeContent);
            when(currentUserService.getUser()).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> imageService.upload(largeFile, ImageType.JOB_BANNER))
                .isInstanceOf(UploadException.class)
                .hasMessageContaining("exceeds maximum size");
        }

        @Test
        void shouldThrowExceptionWhenMimeTypeIsInvalid() {
            // Arrange
            byte[] content = new byte[1024];
            MultipartFile invalidFile = new MockMultipartFile("file", "test.gif", "image/gif", content);
            when(currentUserService.getUser()).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> imageService.upload(invalidFile, ImageType.JOB_BANNER))
                .isInstanceOf(UploadException.class)
                .hasMessageContaining("Invalid image type");
        }

        @Test
        void shouldThrowExceptionWhenFileIsNotAnImage() throws IOException {
            // Arrange
            byte[] notImageContent = "This is not an image".getBytes();
            MultipartFile notImageFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", notImageContent);
            when(currentUserService.getUser()).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> imageService.upload(notImageFile, ImageType.JOB_BANNER))
                .isInstanceOf(UploadException.class)
                .hasMessageContaining("Invalid image file");
        }

        @Test
        void shouldThrowExceptionWhenImageDimensionsExceedMaximum() throws IOException {
            // Arrange
            BufferedImage largeImage = new BufferedImage(MAX_WIDTH + 1, MAX_HEIGHT + 1, BufferedImage.TYPE_INT_RGB);
            byte[] imageBytes = createImageBytes(largeImage);
            MultipartFile largeImageFile = new MockMultipartFile("file", "large.jpg", "image/jpeg", imageBytes);
            when(currentUserService.getUser()).thenReturn(testUser);

            // Act & Assert
            assertThatThrownBy(() -> imageService.upload(largeImageFile, ImageType.JOB_BANNER))
                .isInstanceOf(UploadException.class)
                .hasMessageContaining("dimensions")
                .hasMessageContaining("exceed maximum");
        }
    }

    @Nested
    class UploadDefaultImage {

        private MultipartFile validFile;

        @BeforeEach
        void setUpTestFile() throws IOException {
            BufferedImage validImage = new BufferedImage(800, 600, BufferedImage.TYPE_INT_RGB);
            byte[] imageBytes = createImageBytes(validImage);
            validFile = new MockMultipartFile("file", "default.jpg", "image/jpeg", imageBytes);
        }

        @Test
        void shouldUploadDefaultImageSuccessfullyAsAdmin() throws IOException {
            // Arrange
            when(currentUserService.isAdmin()).thenReturn(true);
            when(currentUserService.getUser()).thenReturn(testUser);
            when(researchGroupRepository.findById(TEST_RESEARCH_GROUP_ID)).thenReturn(Optional.of(testResearchGroup));
            when(imageRepository.save(any(Image.class))).thenAnswer(invocation -> {
                Image savedImage = invocation.getArgument(0);
                savedImage.setImageId(TEST_IMAGE_ID);
                return savedImage;
            });

            // Act
            Image result = imageService.uploadDefaultImage(validFile, ImageType.DEFAULT_JOB_BANNER, TEST_RESEARCH_GROUP_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getImageType()).isEqualTo(ImageType.DEFAULT_JOB_BANNER);
            assertThat(result.getResearchGroup()).isEqualTo(testResearchGroup);
            verify(imageRepository).save(any(Image.class));
        }

        @Test
        void shouldThrowExceptionWhenNonAdminUploadsDefaultImage() {
            // Arrange
            when(currentUserService.isAdmin()).thenReturn(false);

            // Act & Assert
            assertThatThrownBy(() -> imageService.uploadDefaultImage(validFile, ImageType.DEFAULT_JOB_BANNER, TEST_RESEARCH_GROUP_ID))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only admins can upload default images");
        }

        @Test
        void shouldThrowExceptionWhenResearchGroupNotFound() {
            // Arrange
            when(currentUserService.isAdmin()).thenReturn(true);
            when(currentUserService.getUser()).thenReturn(testUser);
            when(researchGroupRepository.findById(TEST_RESEARCH_GROUP_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> imageService.uploadDefaultImage(validFile, ImageType.DEFAULT_JOB_BANNER, TEST_RESEARCH_GROUP_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("ResearchGroup");
        }
    }

    @Nested
    class GetDefaultJobBanners {

        @Test
        void shouldReturnAllDefaultJobBannersWhenResearchGroupIdIsNull() {
            // Arrange
            Image defaultImage1 = ImageTestData.newDefaultJobBanner(testUser, testResearchGroup);
            Image defaultImage2 = ImageTestData.newDefaultJobBanner(testUser, testResearchGroup);
            List<Image> defaultImages = List.of(defaultImage1, defaultImage2);

            when(imageRepository.findDefaultJobBanners()).thenReturn(defaultImages);

            // Act
            List<Image> result = imageService.getDefaultJobBanners(null);

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).containsExactlyInAnyOrder(defaultImage1, defaultImage2);
            verify(imageRepository).findDefaultJobBanners();
            verify(imageRepository, never()).findDefaultJobBannersByResearchGroup(any(UUID.class));
        }

        @Test
        void shouldReturnDefaultJobBannersForResearchGroupWhenIdProvided() {
            // Arrange
            Image defaultImage = ImageTestData.newDefaultJobBanner(testUser, testResearchGroup);
            List<Image> defaultImages = List.of(defaultImage);

            when(imageRepository.findDefaultJobBannersByResearchGroup(TEST_RESEARCH_GROUP_ID)).thenReturn(defaultImages);

            // Act
            List<Image> result = imageService.getDefaultJobBanners(TEST_RESEARCH_GROUP_ID);

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result).contains(defaultImage);
            verify(imageRepository).findDefaultJobBannersByResearchGroup(TEST_RESEARCH_GROUP_ID);
            verify(imageRepository, never()).findDefaultJobBanners();
        }

        @Test
        void shouldReturnEmptyListWhenNoDefaultJobBannersExist() {
            // Arrange
            when(imageRepository.findDefaultJobBanners()).thenReturn(List.of());

            // Act
            List<Image> result = imageService.getDefaultJobBanners(null);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    class GetMyUploadedImages {

        @Test
        void shouldReturnUploadedImagesForCurrentUser() {
            // Arrange
            Image image1 = ImageTestData.newJobBanner(testUser, testResearchGroup);
            Image image2 = ImageTestData.newProfilePicture(testUser);
            List<Image> uploadedImages = List.of(image1, image2);

            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);
            when(imageRepository.findByUploaderId(TEST_USER_ID)).thenReturn(uploadedImages);

            // Act
            List<Image> result = imageService.getMyUploadedImages();

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).containsExactlyInAnyOrder(image1, image2);
            verify(imageRepository).findByUploaderId(TEST_USER_ID);
        }

        @Test
        void shouldReturnEmptyListWhenUserHasNoUploadedImages() {
            // Arrange
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);
            when(imageRepository.findByUploaderId(TEST_USER_ID)).thenReturn(List.of());

            // Act
            List<Image> result = imageService.getMyUploadedImages();

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    class GetResearchGroupJobBanners {

        @Test
        void shouldReturnJobBannersForResearchGroup() {
            // Arrange
            Image banner1 = ImageTestData.newJobBanner(testUser, testResearchGroup);
            Image banner2 = ImageTestData.newJobBanner(testUser, testResearchGroup);
            List<Image> banners = List.of(banner1, banner2);

            when(currentUserService.getResearchGroupIdIfMember()).thenReturn(TEST_RESEARCH_GROUP_ID);
            when(imageRepository.findByImageTypeAndResearchGroup(ImageType.JOB_BANNER, TEST_RESEARCH_GROUP_ID)).thenReturn(banners);

            // Act
            List<Image> result = imageService.getResearchGroupJobBanners();

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result).containsExactlyInAnyOrder(banner1, banner2);
            verify(imageRepository).findByImageTypeAndResearchGroup(ImageType.JOB_BANNER, TEST_RESEARCH_GROUP_ID);
        }

        @Test
        void shouldReturnEmptyListWhenNoJobBannersExist() {
            // Arrange
            when(currentUserService.getResearchGroupIdIfMember()).thenReturn(TEST_RESEARCH_GROUP_ID);
            when(imageRepository.findByImageTypeAndResearchGroup(ImageType.JOB_BANNER, TEST_RESEARCH_GROUP_ID)).thenReturn(List.of());

            // Act
            List<Image> result = imageService.getResearchGroupJobBanners();

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    class Delete {

        @Test
        void shouldDeleteImageSuccessfullyWhenUserIsOwner() {
            // Arrange
            Image profileImage = ImageTestData.newProfilePicture(testUser);
            profileImage.setImageId(TEST_IMAGE_ID);

            when(currentUserService.getUser()).thenReturn(testUser);
            when(currentUserService.isAdmin()).thenReturn(false);
            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.of(profileImage));

            // Act
            imageService.delete(TEST_IMAGE_ID);

            // Assert
            verify(imageRepository).delete(profileImage);
        }

        @Test
        void shouldDeleteImageSuccessfullyWhenUserIsAdmin() {
            // Arrange
            Image defaultImage = ImageTestData.newDefaultJobBanner(testUser, testResearchGroup);
            defaultImage.setImageId(TEST_IMAGE_ID);

            when(currentUserService.getUser()).thenReturn(testUser);
            when(currentUserService.isAdmin()).thenReturn(true);
            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.of(defaultImage));

            // Act
            imageService.delete(TEST_IMAGE_ID);

            // Assert
            verify(imageRepository).delete(defaultImage);
        }

        @Test
        void shouldThrowExceptionWhenImageNotFound() {
            // Arrange
            when(currentUserService.getUser()).thenReturn(testUser);
            when(currentUserService.isAdmin()).thenReturn(false);
            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> imageService.delete(TEST_IMAGE_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Image");
        }

        @Test
        void shouldThrowExceptionWhenNonAdminTriesToDeleteDefaultImage() {
            // Arrange
            Image defaultImage = ImageTestData.newDefaultJobBanner(testUser, testResearchGroup);
            defaultImage.setImageId(TEST_IMAGE_ID);

            when(currentUserService.getUser()).thenReturn(testUser);
            when(currentUserService.isAdmin()).thenReturn(false);
            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.of(defaultImage));

            // Act & Assert
            assertThatThrownBy(() -> imageService.delete(TEST_IMAGE_ID))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only admins can delete default images");
        }

        @Test
        void shouldThrowExceptionWhenUserTriesToDeleteOthersImage() {
            // Arrange
            User otherUser = UserTestData.newUserAll(UUID.randomUUID(), "other@test.com", "Other", "User");
            Image otherUserImage = ImageTestData.newProfilePicture(otherUser);
            otherUserImage.setImageId(TEST_IMAGE_ID);

            when(currentUserService.getUser()).thenReturn(testUser);
            when(currentUserService.isAdmin()).thenReturn(false);
            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.of(otherUserImage));

            // Act & Assert
            assertThatThrownBy(() -> imageService.delete(TEST_IMAGE_ID))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You can only delete images you uploaded");
        }

        @Test
        void shouldDeleteJobBannerWhenUserIsFromSameResearchGroup() {
            // Arrange
            Image jobBanner = ImageTestData.newJobBanner(testUser, testResearchGroup);
            jobBanner.setImageId(TEST_IMAGE_ID);

            when(currentUserService.getUser()).thenReturn(testUser);
            when(currentUserService.isAdmin()).thenReturn(false);
            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.of(jobBanner));

            // Act
            imageService.delete(TEST_IMAGE_ID);

            // Assert
            verify(imageRepository).delete(jobBanner);
        }

        @Test
        void shouldThrowExceptionWhenUserTriesToDeleteJobBannerFromDifferentResearchGroup() {
            // Arrange
            ResearchGroup otherGroup = ResearchGroupTestData.newRgAll(
                "Prof. Other",
                "Other Group",
                "OG",
                "City",
                "Physics",
                "Description",
                "email@test.com",
                "54321",
                "University",
                "Street",
                "https://other.com",
                "ACTIVE"
            );
            otherGroup.setResearchGroupId(UUID.randomUUID());

            Image otherGroupBanner = ImageTestData.newJobBanner(testUser, otherGroup);
            otherGroupBanner.setImageId(TEST_IMAGE_ID);

            when(currentUserService.getUser()).thenReturn(testUser);
            when(currentUserService.isAdmin()).thenReturn(false);
            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.of(otherGroupBanner));

            // Act & Assert
            assertThatThrownBy(() -> imageService.delete(TEST_IMAGE_ID))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You can only delete job banners from your research group");
        }
    }

    @Nested
    class DeleteWithoutChecks {

        @Test
        void shouldDeleteImageWithoutChecks() {
            // Arrange
            Image image = ImageTestData.newJobBanner(testUser, testResearchGroup);
            image.setImageId(TEST_IMAGE_ID);

            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.of(image));

            // Act
            imageService.deleteWithoutChecks(TEST_IMAGE_ID);

            // Assert
            verify(imageRepository).delete(image);
        }

        @Test
        void shouldNotDeleteDefaultImageEvenWithoutChecks() {
            // Arrange
            Image defaultImage = ImageTestData.newDefaultJobBanner(testUser, testResearchGroup);
            defaultImage.setImageId(TEST_IMAGE_ID);

            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.of(defaultImage));

            // Act
            imageService.deleteWithoutChecks(TEST_IMAGE_ID);

            // Assert
            verify(imageRepository, never()).delete(any(Image.class));
        }

        @Test
        void shouldThrowExceptionWhenImageNotFound() {
            // Arrange
            when(imageRepository.findById(TEST_IMAGE_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> imageService.deleteWithoutChecks(TEST_IMAGE_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Image");
        }
    }

    @Nested
    class ReplaceImage {

        @Test
        void shouldReplaceImageSuccessfully() {
            // Arrange
            Image oldImage = ImageTestData.newProfilePicture(testUser);
            oldImage.setImageId(UUID.randomUUID());

            Image newImage = ImageTestData.newProfilePicture(testUser);
            newImage.setImageId(UUID.randomUUID());

            when(imageRepository.findById(oldImage.getImageId())).thenReturn(Optional.of(oldImage));

            // Act
            Image result = imageService.replaceImage(oldImage, newImage);

            // Assert
            assertThat(result).isEqualTo(newImage);
            verify(imageRepository).delete(oldImage);
        }

        @Test
        void shouldNotDeleteOldImageIfItIsDefaultJobBanner() {
            // Arrange
            Image oldDefaultImage = ImageTestData.newDefaultJobBanner(testUser, testResearchGroup);
            oldDefaultImage.setImageId(UUID.randomUUID());

            Image newImage = ImageTestData.newJobBanner(testUser, testResearchGroup);
            newImage.setImageId(UUID.randomUUID());

            // Act
            Image result = imageService.replaceImage(oldDefaultImage, newImage);

            // Assert
            assertThat(result).isEqualTo(newImage);
            verify(imageRepository, never()).findById(any(UUID.class));
            verify(imageRepository, never()).delete(any(Image.class));
        }

        @Test
        void shouldNotDeleteOldImageIfItIsJobBanner() {
            // Arrange
            Image oldJobBanner = ImageTestData.newJobBanner(testUser, testResearchGroup);
            oldJobBanner.setImageId(UUID.randomUUID());

            Image newImage = ImageTestData.newJobBanner(testUser, testResearchGroup);
            newImage.setImageId(UUID.randomUUID());

            // Act
            Image result = imageService.replaceImage(oldJobBanner, newImage);

            // Assert
            assertThat(result).isEqualTo(newImage);
            verify(imageRepository, never()).findById(any(UUID.class));
            verify(imageRepository, never()).delete(any(Image.class));
        }

        @Test
        void shouldNotDeleteWhenOldImageIsNull() {
            // Arrange
            Image newImage = ImageTestData.newProfilePicture(testUser);

            // Act
            Image result = imageService.replaceImage(null, newImage);

            // Assert
            assertThat(result).isEqualTo(newImage);
            verify(imageRepository, never()).delete(any(Image.class));
        }

        @Test
        void shouldNotDeleteWhenOldAndNewImageAreSame() {
            // Arrange
            Image sameImage = ImageTestData.newProfilePicture(testUser);
            sameImage.setImageId(TEST_IMAGE_ID);

            // Act
            Image result = imageService.replaceImage(sameImage, sameImage);

            // Assert
            assertThat(result).isEqualTo(sameImage);
            verify(imageRepository, never()).delete(any(Image.class));
        }

        @Test
        void shouldReturnNullWhenNewImageIsNull() {
            // Arrange
            Image oldImage = ImageTestData.newProfilePicture(testUser);
            oldImage.setImageId(UUID.randomUUID());

            when(imageRepository.findById(oldImage.getImageId())).thenReturn(Optional.of(oldImage));

            // Act
            Image result = imageService.replaceImage(oldImage, null);

            // Assert
            assertThat(result).isNull();
            verify(imageRepository).delete(oldImage);
        }
    }

    /**
     * Helper method to create a byte array from a BufferedImage
     */
    private byte[] createImageBytes(BufferedImage image) {
        try {
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            ImageIO.write(image, "jpg", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new AssertionError("Failed to create image bytes for test", e);
        }
    }
}
