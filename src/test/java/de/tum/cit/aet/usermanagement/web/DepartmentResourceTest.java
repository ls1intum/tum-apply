package de.tum.cit.aet.usermanagement.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.DepartmentCreationDTO;
import de.tum.cit.aet.usermanagement.dto.DepartmentDTO;
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
 * Integration tests for {@link DepartmentResource}.
 * Tests all REST endpoints for department management including:
 * - CRUD operations
 * - Access control and authentication
 * - Filtering by school
 * - Validation
 */
public class DepartmentResourceTest extends AbstractResourceTest {

    private static final String API_BASE_PATH = "/api/departments";

    @Autowired
    DepartmentRepository departmentRepository;

    @Autowired
    SchoolRepository schoolRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    School citSchool;
    School edSchool;
    Department csDepartment;
    Department eeDepartment;
    User adminUser;
    User regularUser;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        api.withoutPostProcessors(); // Clear any authentication from previous tests

        setupSchools();
        setupDepartments();
        setupUsers();
    }

    private void setupSchools() {
        citSchool = SchoolTestData.saved(schoolRepository, "School of Computation, Information and Technology", "CIT");
        edSchool = SchoolTestData.saved(schoolRepository, "School of Engineering and Design", "ED");
    }

    private void setupDepartments() {
        csDepartment = DepartmentTestData.saved(departmentRepository, "Computer Science", citSchool);
        eeDepartment = DepartmentTestData.saved(departmentRepository, "Electrical Engineering", edSchool);
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
    class CreateDepartment {

        @Test
        void adminCanCreateDepartmentWithValidSchool() {
            // Arrange
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("Mathematics", citSchool.getSchoolId());

            // Act
            DepartmentDTO result = api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .postAndRead(API_BASE_PATH, createDTO, DepartmentDTO.class, 201);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.departmentId()).isNotNull();
            assertThat(result.name()).isEqualTo("Mathematics");
            assertThat(result.school()).isNotNull();
            assertThat(result.school().schoolId()).isEqualTo(citSchool.getSchoolId());
            assertThat(result.school().name()).isEqualTo("School of Computation, Information and Technology");

            // Verify saved in database
            Department saved = departmentRepository.findById(result.departmentId()).orElse(null);
            assertThat(saved).isNotNull();
            assertThat(saved.getName()).isEqualTo("Mathematics");
            assertThat(saved.getSchool().getSchoolId()).isEqualTo(citSchool.getSchoolId());
        }

        @Test
        void cannotCreateDepartmentWithInvalidSchoolId() {
            // Arrange
            UUID nonExistentSchoolId = UUID.randomUUID();
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("Mathematics", nonExistentSchoolId);

            // Act & Assert
            api.with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN")).postAndRead(API_BASE_PATH, createDTO, Void.class, 404);
        }

        @Test
        void cannotCreateDepartmentWithDuplicateNameInSameSchool() {
            // Arrange - Use existing department name in same school
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("Computer Science", citSchool.getSchoolId());

            // Act & Assert
            api.with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN")).postAndRead(API_BASE_PATH, createDTO, Void.class, 409);
        }

        @Test
        void canCreateDepartmentWithSameNameInDifferentSchool() {
            // Arrange - Create "Computer Science" in ED school (already exists in CIT school)
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("Computer Science", edSchool.getSchoolId());

            // Act
            DepartmentDTO result = api
                .with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN"))
                .postAndRead(API_BASE_PATH, createDTO, DepartmentDTO.class, 201);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.name()).isEqualTo("Computer Science");
            assertThat(result.school().schoolId()).isEqualTo(edSchool.getSchoolId());
        }

        @Test
        void nonAdminCannotCreateDepartment() {
            // Arrange
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("Mathematics", citSchool.getSchoolId());

            // Act & Assert
            api
                .with(JwtPostProcessors.jwtUser(regularUser.getUserId(), "ROLE_APPLICANT"))
                .postAndRead(API_BASE_PATH, createDTO, Void.class, 403);
        }

        @Test
        void unauthenticatedUserCannotCreateDepartment() {
            // Arrange
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("Mathematics", citSchool.getSchoolId());

            // Act & Assert
            api.postAndRead(API_BASE_PATH, createDTO, Void.class, 401);
        }

        @Test
        void cannotCreateDepartmentWithBlankName() {
            // Arrange
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("", citSchool.getSchoolId());

            // Act & Assert
            api.with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN")).postAndRead(API_BASE_PATH, createDTO, Void.class, 400);
        }

        @Test
        void cannotCreateDepartmentWithNullSchoolId() {
            // Arrange
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("Mathematics", null);

            // Act & Assert
            api.with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN")).postAndRead(API_BASE_PATH, createDTO, Void.class, 400);
        }
    }

    @Nested
    class GetAllDepartments {

        @Test
        void getAllDepartmentsReturnsAllDepartments() {
            // Act
            List<DepartmentDTO> result = api.getAndRead(API_BASE_PATH, Map.of(), new TypeReference<List<DepartmentDTO>>() {}, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).hasSize(2);
            assertThat(result).anyMatch(d -> d.name().equals("Computer Science") && d.school().name().contains("Computation"));
            assertThat(result).anyMatch(d -> d.name().equals("Electrical Engineering") && d.school().name().contains("Engineering"));
        }

        @Test
        void getAllDepartmentsReturnsEmptyListWhenNoDepartmentsExist() {
            // Arrange - Clear all departments
            databaseCleaner.clean();
            setupSchools(); // Re-create schools

            // Act
            List<DepartmentDTO> result = api.getAndRead(API_BASE_PATH, Map.of(), new TypeReference<List<DepartmentDTO>>() {}, 200);

            // Assert
            assertThat(result).isNotNull().isEmpty();
        }

        @Test
        void getAllDepartmentsIsPubliclyAccessible() {
            // Act - No authentication
            List<DepartmentDTO> result = api.getAndRead(API_BASE_PATH, Map.of(), new TypeReference<List<DepartmentDTO>>() {}, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).hasSize(2);
        }

        @Test
        void getAllDepartmentsIncludesSchoolInformation() {
            // Act
            List<DepartmentDTO> result = api.getAndRead(API_BASE_PATH, Map.of(), new TypeReference<List<DepartmentDTO>>() {}, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).allMatch(d -> d.school() != null);
            assertThat(result).allMatch(d -> d.school().schoolId() != null);
            assertThat(result).allMatch(d -> d.school().name() != null);
        }
    }

    @Nested
    class GetDepartmentsBySchoolId {

        @Test
        void getDepartmentsBySchoolIdFiltersBySchool() {
            // Act
            List<DepartmentDTO> result = api.getAndRead(
                API_BASE_PATH,
                Map.of("schoolId", citSchool.getSchoolId().toString()),
                new TypeReference<List<DepartmentDTO>>() {},
                200
            );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Computer Science");
            assertThat(result.get(0).school().schoolId()).isEqualTo(citSchool.getSchoolId());
        }

        @Test
        void getDepartmentsBySchoolIdReturnsEmptyListWhenSchoolHasNoDepartments() {
            // Arrange - Create a new school with no departments
            School emptySchool = SchoolTestData.saved(schoolRepository, "School of Life Sciences", "LS");

            // Act
            List<DepartmentDTO> result = api.getAndRead(
                API_BASE_PATH,
                Map.of("schoolId", emptySchool.getSchoolId().toString()),
                new TypeReference<List<DepartmentDTO>>() {},
                200
            );

            // Assert
            assertThat(result).isNotNull().isEmpty();
        }

        @Test
        void getDepartmentsBySchoolIdReturns404WhenSchoolNotFound() {
            // Arrange
            UUID nonExistentSchoolId = UUID.randomUUID();

            // Act & Assert
            api.getAndRead(API_BASE_PATH, Map.of("schoolId", nonExistentSchoolId.toString()), Void.class, 404);
        }

        @Test
        void getDepartmentsBySchoolIdIsPubliclyAccessible() {
            // Act - No authentication
            List<DepartmentDTO> result = api.getAndRead(
                API_BASE_PATH,
                Map.of("schoolId", citSchool.getSchoolId().toString()),
                new TypeReference<List<DepartmentDTO>>() {},
                200
            );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result).hasSize(1);
        }
    }

    @Nested
    class GetDepartmentById {

        @Test
        void getDepartmentByIdReturnsDepartmentWhenExists() {
            // Act
            DepartmentDTO result = api.getAndRead(API_BASE_PATH + "/" + csDepartment.getDepartmentId(), Map.of(), DepartmentDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.departmentId()).isEqualTo(csDepartment.getDepartmentId());
            assertThat(result.name()).isEqualTo("Computer Science");
            assertThat(result.school()).isNotNull();
            assertThat(result.school().schoolId()).isEqualTo(citSchool.getSchoolId());
        }

        @Test
        void getDepartmentByIdReturns404WhenNotFound() {
            // Arrange
            UUID nonExistentId = UUID.randomUUID();

            // Act & Assert
            api.getAndRead(API_BASE_PATH + "/" + nonExistentId, Map.of(), Void.class, 404);
        }

        @Test
        void getDepartmentByIdIsPubliclyAccessible() {
            // Act - No authentication
            DepartmentDTO result = api.getAndRead(API_BASE_PATH + "/" + csDepartment.getDepartmentId(), Map.of(), DepartmentDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.departmentId()).isEqualTo(csDepartment.getDepartmentId());
        }

        @Test
        void getDepartmentByIdIncludesSchoolInformation() {
            // Act
            DepartmentDTO result = api.getAndRead(API_BASE_PATH + "/" + csDepartment.getDepartmentId(), Map.of(), DepartmentDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.school()).isNotNull();
            assertThat(result.school().schoolId()).isEqualTo(citSchool.getSchoolId());
            assertThat(result.school().name()).isEqualTo("School of Computation, Information and Technology");
            assertThat(result.school().abbreviation()).isEqualTo("CIT");
        }
    }

    @Nested
    class NullHandling {

        @Test
        void departmentMustHaveSchool() {
            // This is enforced by validation - schoolId is @NotNull in DepartmentCreationDTO
            // Arrange
            DepartmentCreationDTO createDTO = new DepartmentCreationDTO("Mathematics", null);

            // Act & Assert
            api.with(JwtPostProcessors.jwtUser(adminUser.getUserId(), "ROLE_ADMIN")).postAndRead(API_BASE_PATH, createDTO, Void.class, 400);
        }

        @Test
        void getAllDepartmentsAlwaysIncludesSchoolInfo() {
            // Act
            List<DepartmentDTO> result = api.getAndRead(API_BASE_PATH, Map.of(), new TypeReference<List<DepartmentDTO>>() {}, 200);

            // Assert - All departments should have school information
            assertThat(result).isNotNull();
            assertThat(result).allMatch(d -> d.school() != null);
            assertThat(result).allMatch(d -> d.school().schoolId() != null);
        }
    }
}
