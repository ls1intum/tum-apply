package de.tum.cit.aet.usermanagement.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.SchoolCreationDTO;
import de.tum.cit.aet.usermanagement.dto.SchoolDTO;
import de.tum.cit.aet.usermanagement.dto.SchoolShortDTO;
import de.tum.cit.aet.usermanagement.repository.DepartmentRepository;
import de.tum.cit.aet.usermanagement.repository.SchoolRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.DepartmentTestData;
import de.tum.cit.aet.utility.testdata.SchoolTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Integration tests for {@link SchoolResource}.
 * Tests all REST endpoints for school management including:
 * - CRUD operations
 * - Access control and authentication
 * - Validation
 */
public class SchoolResourceTest extends AbstractResourceTest {

    private static final String API_BASE_PATH = "/api/schools";

    @Autowired
    SchoolRepository schoolRepository;

    @Autowired
    DepartmentRepository departmentRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    School testSchool;
    School secondSchool;
    User adminUser;
    User regularUser;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        api.withoutPostProcessors(); // Clear any authentication from previous tests

        setupSchools();
        setupUsers();
    }

    private void setupSchools() {
        testSchool = SchoolTestData.saved(schoolRepository, "School of Computation, Information and Technology", "CIT");
        secondSchool = SchoolTestData.saved(schoolRepository, "School of Engineering and Design", "ED");
    }

    private void setupUsers() {
        adminUser = UserTestData.newUserAll(UUID.randomUUID(), "admin@tum.de", "Admin", "User");
        adminUser.setSelectedLanguage("en");
        adminUser = userRepository.save(adminUser);

        regularUser = UserTestData.newUserAll(UUID.randomUUID(), "user@tum.de", "Regular", "User");
        regularUser.setSelectedLanguage("en");
        regularUser = userRepository.save(regularUser);
    }

    @Nested
    class CreateSchool {

        @Test
        void adminCanCreateSchool() {
            // Arrange
            SchoolCreationDTO createDTO = new SchoolCreationDTO("School of Medicine", "MED");

            // Act
            SchoolShortDTO result = api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .postAndRead(API_BASE_PATH, createDTO, SchoolShortDTO.class, 201);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.schoolId()).isNotNull();
            assertThat(result.name()).isEqualTo("School of Medicine");
            assertThat(result.abbreviation()).isEqualTo("MED");

            // Verify saved in database
            School saved = schoolRepository.findById(result.schoolId()).orElse(null);
            assertThat(saved).isNotNull();
            assertThat(saved.getName()).isEqualTo("School of Medicine");
        }

        @Test
        void nonAdminCannotCreateSchool() {
            // Arrange
            SchoolCreationDTO createDTO = new SchoolCreationDTO("School of Medicine", "MED");

            // Act & Assert
            api
                .with(JwtPostProcessors.jwtUser(regularUser.getUserId(), "ROLE_APPLICANT"))
                .postAndRead(API_BASE_PATH, createDTO, Void.class, 403);
        }

        @Test
        void unauthenticatedUserCannotCreateSchool() {
            // Arrange
            SchoolCreationDTO createDTO = new SchoolCreationDTO("School of Medicine", "MED");

            // Act & Assert
            api.postAndRead(API_BASE_PATH, createDTO, Void.class, 401);
        }

        @Test
        void cannotCreateSchoolWithDuplicateName() {
            // Arrange - Use existing school name
            SchoolCreationDTO createDTO = new SchoolCreationDTO("School of Computation, Information and Technology", "CIT2");

            // Act & Assert
            api.with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN")).postAndRead(API_BASE_PATH, createDTO, Void.class, 409);
        }

        @Test
        void cannotCreateSchoolWithBlankName() {
            // Arrange
            SchoolCreationDTO createDTO = new SchoolCreationDTO("", "MED");

            // Act & Assert
            api.with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN")).postAndRead(API_BASE_PATH, createDTO, Void.class, 400);
        }

        @Test
        void cannotCreateSchoolWithBlankAbbreviation() {
            // Arrange
            SchoolCreationDTO createDTO = new SchoolCreationDTO("School of Medicine", "");

            // Act & Assert
            api.with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN")).postAndRead(API_BASE_PATH, createDTO, Void.class, 400);
        }
    }

    @Nested
    class GetAllSchools {

        @Test
        void getAllSchoolsReturnsAllSchools() {
            // Act
            List<SchoolShortDTO> result = api.getAndRead(API_BASE_PATH, Map.of(), new TypeReference<List<SchoolShortDTO>>() {}, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).hasSize(2);
            assertThat(result).anyMatch(s -> s.name().equals("School of Computation, Information and Technology"));
            assertThat(result).anyMatch(s -> s.name().equals("School of Engineering and Design"));
        }

        @Test
        void getAllSchoolsReturnsEmptyListWhenNoSchoolsExist() {
            // Arrange - Clear all schools
            databaseCleaner.clean();

            // Act
            List<SchoolShortDTO> result = api.getAndRead(API_BASE_PATH, Map.of(), new TypeReference<List<SchoolShortDTO>>() {}, 200);

            // Assert
            assertThat(result).isNotNull().isEmpty();
        }

        @Test
        void getAllSchoolsIsPubliclyAccessible() {
            // Act - No authentication
            List<SchoolShortDTO> result = api.getAndRead(API_BASE_PATH, Map.of(), new TypeReference<List<SchoolShortDTO>>() {}, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).hasSize(2);
        }

        @Test
        void getAllSchoolsWithDepartmentsIncludesDepartments() {
            // Test the /with-departments endpoint to verify departments are included

            // Act
            List<SchoolDTO> result = api.getAndRead(
                API_BASE_PATH + "/with-departments",
                Map.of(),
                new TypeReference<List<SchoolDTO>>() {},
                200
            );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).allMatch(s -> s.departments() != null);
        }
    }

    @Nested
    class GetSchoolById {

        @Test
        void getSchoolByIdReturnsSchoolWhenExists() {
            // Act
            SchoolDTO result = api.getAndRead(API_BASE_PATH + "/" + testSchool.getSchoolId(), Map.of(), SchoolDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.schoolId()).isEqualTo(testSchool.getSchoolId());
            assertThat(result.name()).isEqualTo("School of Computation, Information and Technology");
            assertThat(result.abbreviation()).isEqualTo("CIT");
            assertThat(result.departments()).isNotNull();
        }

        @Test
        void getSchoolByIdReturns404WhenNotFound() {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();

            // Act & Assert
            api.getAndRead(API_BASE_PATH + "/" + nonExistentId, Map.of(), Void.class, 404);
        }

        @Test
        void getSchoolByIdIsPubliclyAccessible() {
            // Act - No authentication
            SchoolDTO result = api.getAndRead(API_BASE_PATH + "/" + testSchool.getSchoolId(), Map.of(), SchoolDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.schoolId()).isEqualTo(testSchool.getSchoolId());
        }
    }

    @Nested
    class NullHandling {

        @Test
        void schoolWithNoDepartmentsReturnsEmptyList() {
            // Arrange - testSchool already has no departments

            // Act
            SchoolDTO result = api.getAndRead(API_BASE_PATH + "/" + testSchool.getSchoolId(), Map.of(), SchoolDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.departments()).isNotNull().isEmpty();
        }

        @Test
        void getAllSchoolsWithDepartmentsHandlesSchoolsWithoutDepartments() {
            // Test that /with-departments endpoint returns empty department lists correctly

            // Act
            List<SchoolDTO> result = api.getAndRead(
                API_BASE_PATH + "/with-departments",
                Map.of(),
                new TypeReference<List<SchoolDTO>>() {},
                200
            );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).allMatch(s -> s.departments() != null);
            assertThat(result).allMatch(s -> s.departments().isEmpty()); // Currently no departments
        }
    }

    @Nested
    class UpdateSchool {

        @Test
        void adminCanUpdateSchool() {
            SchoolCreationDTO updateDTO = new SchoolCreationDTO("Updated School", "UPD");

            SchoolShortDTO result = api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .putAndRead(API_BASE_PATH + "/update/" + testSchool.getSchoolId(), updateDTO, SchoolShortDTO.class, 200);

            assertThat(result).isNotNull();
            assertThat(result.schoolId()).isEqualTo(testSchool.getSchoolId());
            assertThat(result.name()).isEqualTo("Updated School");
            assertThat(result.abbreviation()).isEqualTo("UPD");
        }

        @Test
        void nonAdminCannotUpdateSchool() {
            SchoolCreationDTO updateDTO = new SchoolCreationDTO("Updated School", "UPD");

            api
                .with(JwtPostProcessors.jwtUser(regularUser.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(API_BASE_PATH + "/update/" + testSchool.getSchoolId(), updateDTO, Void.class, 403);
        }

        @Test
        void cannotUpdateSchoolWithDuplicateName() {
            SchoolCreationDTO updateDTO = new SchoolCreationDTO(secondSchool.getName(), "UPD");

            api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .putAndRead(API_BASE_PATH + "/update/" + testSchool.getSchoolId(), updateDTO, Void.class, 409);
        }
    }

    @Nested
    class DeleteSchool {

        @Test
        void adminCanDeleteSchoolWhenNoDepartmentsLinked() {
            api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .deleteAndRead(API_BASE_PATH + "/delete/" + secondSchool.getSchoolId(), null, Void.class, 204);

            assertThat(schoolRepository.findById(secondSchool.getSchoolId())).isEmpty();
        }

        @Test
        void cannotDeleteSchoolWhenDepartmentsLinked() {
            DepartmentTestData.saved(departmentRepository, "Linked Department", testSchool);

            api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .deleteAndRead(API_BASE_PATH + "/delete/" + testSchool.getSchoolId(), null, Void.class, 400);

            assertThat(schoolRepository.findById(testSchool.getSchoolId())).isPresent();
        }

        @Test
        void nonAdminCannotDeleteSchool() {
            api
                .with(JwtPostProcessors.jwtUser(regularUser.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead(API_BASE_PATH + "/delete/" + secondSchool.getSchoolId(), null, Void.class, 403);
        }

        @Test
        void deleteSchoolReturns404ForUnknownSchool() {
            api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .deleteAndRead(API_BASE_PATH + "/delete/" + UUID.randomUUID(), null, Void.class, 404);
        }
    }
}
