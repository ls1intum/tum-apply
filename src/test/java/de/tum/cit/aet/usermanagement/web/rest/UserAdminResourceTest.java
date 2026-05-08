package de.tum.cit.aet.usermanagement.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.AdminUserOverviewDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.PageResponse;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.core.type.TypeReference;

/**
 * Integration tests for {@link de.tum.cit.aet.usermanagement.web.UserAdminResource}.
 * Verifies admin success and professor 403 paths plus validation/auth edge cases.
 */
class UserAdminResourceTest extends AbstractResourceTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    ResearchGroup researchGroup;
    User adminUser;
    User professor;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        api.withoutPostProcessors();

        researchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Prof. Doe",
            "Algorithms Group",
            "ALG",
            "Munich",
            "We do cool stuff",
            "alg@example.com",
            "80333",
            "CIT",
            "Arcisstr. 21",
            "https://alg.tum.de",
            "ACTIVE"
        );

        adminUser = UserTestData.saveAdmin(userRepository);
        professor = UserTestData.saveProfessor(researchGroup, userRepository);
    }

    @Nested
    class GetAllUsers {

        @Test
        void shouldReturnUsersForAdmin() {
            PageResponse<AdminUserOverviewDTO> page = api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .getAndRead("/api/admin/users", Map.of("pageNumber", "0", "pageSize", "10"), new TypeReference<>() {}, 200);

            assertThat(page.content()).isNotNull();
            assertThat(page.totalElements()).isGreaterThanOrEqualTo(1);
        }

        @Test
        void shouldRejectProfessor() {
            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/admin/users", Map.of("pageNumber", "0", "pageSize", "10"), new TypeReference<>() {}, 403);
        }
    }

    @Nested
    class GetUserById {

        @Test
        void shouldReturn404ForUnknownUser() {
            api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .getAndRead("/api/admin/users/" + UUID.randomUUID(), null, Void.class, 404);
        }
    }

    @Nested
    class DeleteUser {

        @Test
        void shouldRejectSelfDelete() {
            api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .deleteAndRead("/api/admin/users/" + adminUser.getUserId(), null, Void.class, 400);
        }

        @Test
        void shouldRejectProfessor() {
            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .deleteAndRead("/api/admin/users/" + UUID.randomUUID(), null, Void.class, 403);
        }
    }

    @Nested
    class CreateUser {

        @Test
        void shouldRejectInvalidPayload() {
            // Empty body — required @NotBlank fields (firstName, lastName, email, password) are missing.
            Map<String, Object> emptyPayload = new HashMap<>();
            api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .postAndRead("/api/admin/users", emptyPayload, Void.class, 400);
        }

        @Test
        void shouldRejectProfessor() {
            Map<String, Object> payload = new HashMap<>();
            payload.put("firstName", "New");
            payload.put("lastName", "User");
            payload.put("email", "new.user@tum.de");
            payload.put("password", "supersecure1");
            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/admin/users", payload, Void.class, 403);
        }
    }
}
