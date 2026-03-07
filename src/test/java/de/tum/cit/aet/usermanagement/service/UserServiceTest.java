package de.tum.cit.aet.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.exception.BadRequestException;
import de.tum.cit.aet.core.service.ImageService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    private static final UUID TEST_USER_ID = UUID.randomUUID();

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = UserTestData.newUserAll(TEST_USER_ID, "test@example.com", "Test", "User");
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
    }

    @Nested
    class UpdateAvatar {

        @Test
        void shouldClearAvatarWithoutOwnershipCheckWhenAvatarUrlIsBlank() {
            testUser.setAvatar("/images/profiles/existing.jpg");

            userService.updateAvatar(TEST_USER_ID.toString(), "   ");

            assertThat(testUser.getAvatar()).isNull();
            verify(imageService, never()).assertUserOwnsProfilePictureUrl(TEST_USER_ID, "   ");
            verify(userRepository).save(testUser);
        }

        @Test
        void shouldNormalizeAndValidateAvatarUrlBeforePersisting() {
            userService.updateAvatar(TEST_USER_ID.toString(), "  /images/profiles/avatar.jpg  ");

            assertThat(testUser.getAvatar()).isEqualTo("/images/profiles/avatar.jpg");
            verify(imageService).assertUserOwnsProfilePictureUrl(TEST_USER_ID, "/images/profiles/avatar.jpg");
            verify(userRepository).save(testUser);
        }

        @Test
        void shouldRejectUnsafeAvatarUrlWithoutPersistingIt() {
            doThrow(new BadRequestException("Avatar URL must reference an existing profile picture owned by the current user"))
                .when(imageService)
                .assertUserOwnsProfilePictureUrl(TEST_USER_ID, "https://example.com/tracker.png");

            assertThatThrownBy(() -> userService.updateAvatar(TEST_USER_ID.toString(), "https://example.com/tracker.png"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Avatar URL must reference an existing profile picture owned by the current user");

            assertThat(testUser.getAvatar()).isNull();
            verify(userRepository, never()).save(testUser);
        }
    }
}
