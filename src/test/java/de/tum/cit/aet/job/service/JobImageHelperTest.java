package de.tum.cit.aet.job.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.utility.testdata.ImageTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JobImageHelperTest {

    @Mock
    private ImageRepository imageRepository;

    @InjectMocks
    private JobImageHelper jobImageHelper;

    @Test
    void getImageForJobReturnsExistingImage() {
        UUID imageId = UUID.randomUUID();
        Image image = ImageTestData.newJobBanner(
            UserTestData.newUserAll(UUID.randomUUID(), "prof@test.de", "Prof", "Test"),
            ResearchGroupTestData.newRgAll(
                "Chair",
                "Research Group",
                "RG",
                "Munich",
                "CS",
                "Desc",
                "rg@test.de",
                "123",
                "Street",
                null,
                "ACTIVE"
            )
        );
        image.setImageId(imageId);

        when(imageRepository.findById(imageId)).thenReturn(Optional.of(image));

        assertThat(jobImageHelper.getImageForJob(imageId)).isSameAs(image);
    }

    @Test
    void getImageForJobThrowsForMissingImage() {
        UUID imageId = UUID.randomUUID();
        when(imageRepository.findById(imageId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobImageHelper.getImageForJob(imageId)).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void replaceJobImageOnlySwitchesReference() {
        Image oldImage = ImageTestData.newProfilePicture(UserTestData.newUserAll(UUID.randomUUID(), "old@test.de", "Old", "User"));
        Image newImage = ImageTestData.newProfilePicture(UserTestData.newUserAll(UUID.randomUUID(), "new@test.de", "New", "User"));

        assertThat(jobImageHelper.replaceJobImage(oldImage, newImage)).isSameAs(newImage);
        assertThat(jobImageHelper.replaceJobImage(oldImage, null)).isNull();
    }
}
