package de.tum.cit.aet.usermanagement.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.UpdateUserNameDTO;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.service.KeycloakUserService;
import de.tum.cit.aet.usermanagement.service.UserService;
import de.tum.cit.aet.usermanagement.web.UserResource.UpdatePasswordDTO;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Integration tests for {@link de.tum.cit.aet.usermanagement.web.UserResource}.
 * Covers all REST endpoints:
 * - GET /api/users/me
 * - PUT /api/users/name
 * - PUT /api/users/password
 */
public class UserResourceTest extends AbstractResourceTest {

    private static final String API_BASE_PATH = "/api/users";

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    UserRepository userRepository;

    @Autowired
    MvcTestClient api;

    @Autowired
    AuthenticationService authenticationService;

    @Autowired
    UserService userService;

    @Autowired
    KeycloakUserService keycloakUserService;

    User currentUser;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        currentUser = UserTestData.createUserWithoutResearchGroup(userRepository, "current.user@tum.de", "Current", "User", "ab12cde");
    }

    @Nested
    class GetCurrentUser {

        @Test
        void returnsUserInfo() {
            when(authenticationService.provisionUserIfMissing(any(Jwt.class))).thenReturn(currentUser);

            UserShortDTO result = api
                .with(JwtPostProcessors.jwtUser(currentUser.getUserId(), "ROLE_APPLICANT"))
                .getAndRead(API_BASE_PATH + "/me", Map.of(), UserShortDTO.class, 200);

            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(currentUser.getUserId());
            assertThat(result.getUniversityId()).isEqualTo(currentUser.getUniversityId());
            assertThat(result.getEmail()).isEqualTo(currentUser.getEmail());
        }

        @Test
        void returnsNoContentWhenUserIsMissing() {
            when(authenticationService.provisionUserIfMissing(any(Jwt.class))).thenReturn(null);

            api
                .with(JwtPostProcessors.jwtUser(currentUser.getUserId(), "ROLE_APPLICANT"))
                .getAndRead(API_BASE_PATH + "/me", Map.of(), Void.class, 204);
        }

        @Test
        void returns401WhenUnauthenticated() {
            api.withoutPostProcessors().getAndRead(API_BASE_PATH + "/me", Map.of(), Void.class, 401);
        }
    }

    @Nested
    class UpdateUserName {

        @Test
        void returnsNoContentWithValidData() {
            UpdateUserNameDTO dto = new UpdateUserNameDTO("NewFirst", "NewLast");

            api
                .with(JwtPostProcessors.jwtUser(currentUser.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(API_BASE_PATH + "/name", dto, Void.class, 204);

            verify(userService).updateNames(currentUser.getUserId().toString(), "NewFirst", "NewLast");
        }

        @Test
        void returns400WithInvalidData() {
            UpdateUserNameDTO invalidDto = new UpdateUserNameDTO(null, null);

            api
                .with(JwtPostProcessors.jwtUser(currentUser.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(API_BASE_PATH + "/name", invalidDto, Void.class, 400);
        }

        @Test
        void returns401WhenUnauthenticated() {
            UpdateUserNameDTO dto = new UpdateUserNameDTO("NewFirst", "NewLast");

            api.withoutPostProcessors().putAndRead(API_BASE_PATH + "/name", dto, Void.class, 401);
        }
    }

    @Nested
    class UpdatePassword {

        @Test
        void returnsNoContentWhenPasswordUpdateSucceeds() {
            String newPassword = "StrongPassword123!";
            when(keycloakUserService.setPassword(anyString(), eq(newPassword))).thenReturn(true);

            UpdatePasswordDTO dto = new UpdatePasswordDTO(newPassword);

            api
                .with(JwtPostProcessors.jwtUser(currentUser.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(API_BASE_PATH + "/password", dto, Void.class, 204);

            verify(keycloakUserService).setPassword(currentUser.getUserId().toString(), newPassword);
        }

        @Test
        void returns400WhenPasswordUpdateFails() {
            String newPassword = "AnotherStrongPassword!";
            when(keycloakUserService.setPassword(anyString(), eq(newPassword))).thenReturn(false);

            UpdatePasswordDTO dto = new UpdatePasswordDTO(newPassword);

            api
                .with(JwtPostProcessors.jwtUser(currentUser.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(API_BASE_PATH + "/password", dto, Void.class, 400);
        }

        @Test
        void returns400ForBlankPassword() {
            UpdatePasswordDTO dto = new UpdatePasswordDTO("");

            api
                .with(JwtPostProcessors.jwtUser(currentUser.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(API_BASE_PATH + "/password", dto, Void.class, 400);
        }

        @Test
        void returns401WhenUnauthenticated() {
            UpdatePasswordDTO dto = new UpdatePasswordDTO("StrongPassword123!");

            api.withoutPostProcessors().putAndRead(API_BASE_PATH + "/password", dto, Void.class, 401);
        }
    }
}
