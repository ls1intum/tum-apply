package de.tum.cit.aet.interview.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.dto.AddIntervieweesDTO;
import de.tum.cit.aet.interview.dto.CreateSlotsDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewSlotDTO;
import de.tum.cit.aet.interview.dto.IntervieweeDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.ApplicationTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class InterviewResourceTest extends AbstractResourceTest {

    @Autowired
    private InterviewProcessRepository interviewProcessRepository;

    @Autowired
    private InterviewSlotRepository interviewSlotRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResearchGroupRepository researchGroupRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private IntervieweeRepository intervieweeRepository;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @Autowired
    private MvcTestClient api;

    private User professor;
    private User employee;
    private Job job;
    private InterviewProcess interviewProcess;
    private ResearchGroup researchGroup;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        researchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Algorithms Group",
            "Prof. Doe",
            "alg@example.com",
            "ALG",
            "CS",
            "We do cool stuff",
            "alg@example.com",
            "80333",
            "CIT",
            "Arcisstr. 21",
            "https://alg.tum.de",
            "ACTIVE"
        );

        professor = UserTestData.savedProfessorAll(
            userRepository,
            researchGroup,
            null,
            "prof.doe@tum.de",
            "John",
            "Doe",
            "en",
            "+49 89 1234",
            "https://doe.tum.de",
            "https://linkedin.com/in/doe",
            "DE",
            null,
            "männlich",
            UUID.randomUUID().toString().replace("-", "").substring(0, 7)
        );

        // Create employee in the same research group
        User employeeUser = new User();
        employeeUser.setUserId(UUID.randomUUID());
        employeeUser.setFirstName("Employee");
        employeeUser.setLastName("User");
        employeeUser.setEmail("employee@example.com");
        employeeUser.setSelectedLanguage("en");
        employeeUser.setResearchGroup(researchGroup);
        employeeUser.setUniversityId(UUID.randomUUID().toString().replace("-", "").substring(0, 7));

        UserResearchGroupRole link = new UserResearchGroupRole();
        link.setUser(employeeUser);
        link.setResearchGroup(researchGroup);
        link.setRole(UserRole.EMPLOYEE);
        employeeUser.getResearchGroupRoles().add(link);

        employee = userRepository.save(employeeUser);

        job = JobTestData.saved(jobRepository, professor, researchGroup, "Software Engineer", JobState.PUBLISHED, LocalDate.now());

        interviewProcess = new InterviewProcess();
        interviewProcess.setJob(job);
        interviewProcess = interviewProcessRepository.save(interviewProcess);
    }

    /**
     * Helper method to create another professor in a different research group.
     * Used for testing 403 Forbidden scenarios.
     */
    private User createOtherProfessor() {
        ResearchGroup otherResearchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Other Group",
            "Prof. Smith",
            "other@example.com",
            "OTH",
            "CS",
            "Other research",
            "other@example.com",
            "80333",
            "CIT",
            "Other Street",
            "https://other.tum.de",
            "ACTIVE"
        );

        return UserTestData.savedProfessorAll(
            userRepository,
            otherResearchGroup,
            null,
            "other.prof@tum.de",
            "Jane",
            "Doe",
            "en",
            "+49 89 5678",
            "https://jane.tum.de",
            "https://linkedin.com/in/jane",
            "DE",
            null,
            "weiblich",
            UUID.randomUUID().toString().replace("-", "").substring(0, 7)
        );
    }

    // ==================== GET INTERVIEW PROCESS DETAILS TESTS ====================

    @Nested
    class GetInterviewProcessDetails {

        @Test
        void returnsCorrectDetails() {
            // Act
            InterviewOverviewDTO details = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/processes/" + interviewProcess.getId(), null, InterviewOverviewDTO.class, 200);

            // Assert
            assertThat(details.jobId()).isEqualTo(job.getJobId());
            assertThat(details.jobTitle()).isEqualTo(job.getTitle());
            assertThat(details.totalInterviews()).isZero();
        }

        @Test
        void forbiddenForOtherUser() {
            // Arrange
            User otherProfessor = createOtherProfessor();

            // Act
            api
                .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/processes/" + interviewProcess.getId(), null, Void.class, 403);
        }

        @Test
        void notFoundForNonExistentId() {
            // Act
            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/processes/" + UUID.randomUUID(), null, Void.class, 404);
        }

        @Test
        void returnsCorrectDetailsForEmployee() {
            // Act
            InterviewOverviewDTO details = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .getAndRead("/api/interviews/processes/" + interviewProcess.getId(), null, InterviewOverviewDTO.class, 200);

            // Assert
            assertThat(details.jobId()).isEqualTo(job.getJobId());
            assertThat(details.jobTitle()).isEqualTo(job.getTitle());
            assertThat(details.totalInterviews()).isZero();
        }
    }

    // ==================== GET INTERVIEW OVERVIEW TESTS ====================

    @Nested
    class GetInterviewOverview {

        @Test
        void returnsOverviewForProfessor() {
            // Act
            List<InterviewOverviewDTO> overview = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/overview", null, new TypeReference<List<InterviewOverviewDTO>>() {}, 200);

            // Assert
            assertThat(overview).isNotEmpty();
            assertThat(overview.get(0).jobId()).isEqualTo(job.getJobId());
            assertThat(overview.get(0).jobTitle()).isEqualTo(job.getTitle());
        }

        @Test
        void returnsEmptyListWhenNoProcesses() {
            // Arrange
            interviewProcessRepository.deleteAll();

            // Act
            List<InterviewOverviewDTO> overview = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/overview", null, new TypeReference<List<InterviewOverviewDTO>>() {}, 200);

            // Assert
            assertThat(overview).isEmpty();
        }

        @Test
        void returnsOverviewForEmployee() {
            // Act
            List<InterviewOverviewDTO> overview = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .getAndRead("/api/interviews/overview", null, new TypeReference<List<InterviewOverviewDTO>>() {}, 200);

            // Assert
            assertThat(overview).isNotEmpty();
            assertThat(overview.get(0).jobId()).isEqualTo(job.getJobId());
            assertThat(overview.get(0).jobTitle()).isEqualTo(job.getTitle());
        }

        @Test
        void forbiddenForStudent() {
            // Arrange
            User student = UserTestData.createUserWithoutResearchGroup(userRepository, "student@tum.de", "Student", "One", "123456");

            // Act
            api
                .with(JwtPostProcessors.jwtUser(student.getUserId(), "ROLE_STUDENT"))
                .getAndRead("/api/interviews/overview", null, Void.class, 403);
        }
    }

    @Nested
    class CreateSlots {

        @Test
        void createSlotsAsProfessorCreatesAndReturnsSlots() {
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Room 101",
                "http://zoom.us/j/123"
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            List<InterviewSlotDTO> createdSlots = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            assertThat(createdSlots).hasSize(1);

            InterviewSlotDTO createdSlot = createdSlots.get(0);
            assertThat(createdSlot.location()).isEqualTo("Room 101");
            assertThat(createdSlot.streamLink()).isEqualTo("http://zoom.us/j/123");
            assertThat(createdSlot.isBooked()).isFalse();

            // Verify exact date and time values
            assertThat(createdSlot.startDateTime()).isNotNull();
            assertThat(createdSlot.endDateTime()).isNotNull();
            // Convert to LocalDateTime and check the exact values we sent
            LocalDateTime expectedStart = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(10, 0));
            LocalDateTime expectedEnd = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(11, 0));
            assertThat(createdSlot.startDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(expectedStart);
            assertThat(createdSlot.endDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(expectedEnd);

            // Verify persistence
            List<InterviewSlot> savedSlots = interviewSlotRepository.findAll();
            assertThat(savedSlots).hasSize(1);
            assertThat(savedSlots.get(0).getLocation()).isEqualTo("Room 101");
        }

        @Test
        void createSlotsAsEmployeeCreatesAndReturnsSlots() {
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(12, 0),
                LocalTime.of(13, 0),
                "Room 101",
                "http://zoom.us/j/123"
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            List<InterviewSlotDTO> createdSlots = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            assertThat(createdSlots).hasSize(1);

            InterviewSlotDTO createdSlot = createdSlots.get(0);
            assertThat(createdSlot.location()).isEqualTo("Room 101");
            assertThat(createdSlot.streamLink()).isEqualTo("http://zoom.us/j/123");
            assertThat(createdSlot.isBooked()).isFalse();

            // Verify exact time values
            LocalDateTime expectedStart = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(12, 0));
            LocalDateTime expectedEnd = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(13, 0));
            assertThat(createdSlot.startDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(expectedStart);
            assertThat(createdSlot.endDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(expectedEnd);
        }

        @Test
        void createSlotsWithTimeConflictReturnsConflict() {
            // Create an existing slot
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Room 101",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            // First creation succeeds
            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            // Second creation with overlapping time should fail
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/slots/create", dto, Void.class, 409);
            assertThat(result).isNull();
        }

        @Test
        void createSlotsWithInvalidDataReturnsBadRequest() {
            CreateSlotsDTO.SlotInput invalidInput = new CreateSlotsDTO.SlotInput(
                null, // date is required
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Room 101",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(invalidInput));

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/slots/create", dto, Void.class, 400);
            assertThat(result).isNull();
        }

        @Test
        void createSlotsForOtherProfessorJobReturnsForbidden() {
            // Create a separate research group for the other professor
            ResearchGroup otherResearchGroup = ResearchGroupTestData.savedAll(
                researchGroupRepository,
                "Other Group",
                "Prof. Smith",
                "other@example.com",
                "OTH",
                "CS",
                "Other research",
                "other@example.com",
                "80333",
                "CIT",
                "Other Street",
                "https://other.tum.de",
                "ACTIVE"
            );

            // Create another professor in a DIFFERENT research group
            User otherProfessor = UserTestData.savedProfessorAll(
                userRepository,
                otherResearchGroup,
                null,
                "other.prof@tum.de",
                "Jane",
                "Doe",
                "en",
                "+49 89 5678",
                "https://jane.tum.de",
                "https://linkedin.com/in/jane",
                "DE",
                null,
                "weiblich",
                UUID.randomUUID().toString().replace("-", "").substring(0, 7)
            );

            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Room 101",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            Void result = api
                .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/slots/create", dto, Void.class, 403);
            assertThat(result).isNull();
        }

        @Test
        void createSlotsForNonExistentProcessReturnsNotFound() {
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Room 101",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/processes/" + UUID.randomUUID() + "/slots/create", dto, Void.class, 404);
            assertThat(result).isNull();
        }
    }

    @Nested
    class GetSlots {

        @Test
        void getSlotsByProcessIdAsProfessorReturnsSlots() {
            CreateSlotsDTO.SlotInput slotInput1 = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Room 101",
                null
            );
            CreateSlotsDTO.SlotInput slotInput2 = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(11, 0),
                LocalTime.of(12, 0),
                "Room 102",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput1, slotInput2));

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            // Get slots
            List<InterviewSlotDTO> slots = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots",
                    null,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    200
                );

            assertThat(slots).hasSize(2);

            // Verify first slot
            InterviewSlotDTO firstSlot = slots.get(0);
            assertThat(firstSlot.location()).isEqualTo("Room 101");
            assertThat(firstSlot.streamLink()).isNull();
            assertThat(firstSlot.isBooked()).isFalse();
            LocalDateTime expectedStart1 = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(10, 0));
            LocalDateTime expectedEnd1 = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(11, 0));
            assertThat(firstSlot.startDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(expectedStart1);
            assertThat(firstSlot.endDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(expectedEnd1);

            // Verify second slot
            InterviewSlotDTO secondSlot = slots.get(1);
            assertThat(secondSlot.location()).isEqualTo("Room 102");
            assertThat(secondSlot.streamLink()).isNull();
            assertThat(secondSlot.isBooked()).isFalse();
            LocalDateTime expectedStart2 = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(11, 0));
            LocalDateTime expectedEnd2 = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(12, 0));
            assertThat(secondSlot.startDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(expectedStart2);
            assertThat(secondSlot.endDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(expectedEnd2);

            // Verify chronological ordering
            assertThat(firstSlot.startDateTime()).isBefore(secondSlot.startDateTime());
        }

        @Test
        void getSlotsByProcessIdAsEmployeeReturnsSlots() {
            // Create slots first
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Room 101",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            // Get slots as employee
            List<InterviewSlotDTO> slots = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots",
                    null,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    200
                );

            assertThat(slots).hasSize(1);
        }

        @Test
        void getSlotsByProcessIdForOtherProfessorReturnsForbidden() {
            // Create a separate research group for the other professor
            ResearchGroup otherResearchGroup = ResearchGroupTestData.savedAll(
                researchGroupRepository,
                "Other Group",
                "Prof. Smith",
                "other@example.com",
                "OTH",
                "CS",
                "Other research",
                "other@example.com",
                "80333",
                "CIT",
                "Other Street",
                "https://other.tum.de",
                "ACTIVE"
            );

            // Create another professor in a DIFFERENT research group
            User otherProfessor = UserTestData.savedProfessorAll(
                userRepository,
                otherResearchGroup,
                null,
                "other.prof@tum.de",
                "Jane",
                "Doe",
                "en",
                "+49 89 5678",
                "https://jane.tum.de",
                "https://linkedin.com/in/jane",
                "DE",
                null,
                "weiblich",
                UUID.randomUUID().toString().replace("-", "").substring(0, 7)
            );

            Void result = api
                .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/slots", null, Void.class, 403);
            assertThat(result).isNull();
        }

        @Test
        void getSlotsByProcessIdForNonExistentProcessReturnsNotFound() {
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/processes/" + UUID.randomUUID() + "/slots", null, Void.class, 404);
            assertThat(result).isNull();
        }
    }

    // ==================== DELETE SLOT TESTS ====================

    @Nested
    class DeleteSlot {

        @Test
        void deleteSlotReturnsNoContent() {
            // Arrange - Create a slot
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(14, 0),
                LocalTime.of(15, 0),
                "Room 201",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            List<InterviewSlotDTO> createdSlots = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            UUID slotId = createdSlots.get(0).id();

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .deleteAndRead("/api/interviews/slots/" + slotId, null, Void.class, 204);

            // Assert - Verify deletion
            assertThat(interviewSlotRepository.findById(slotId)).isEmpty();
        }

        @Test
        void deleteSlotAsEmployeeReturnsNoContent() {
            // Arrange - Create a slot
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(16, 0),
                LocalTime.of(17, 0),
                "Room 201",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            List<InterviewSlotDTO> createdSlots = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            UUID slotId = createdSlots.get(0).id();

            api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .deleteAndRead("/api/interviews/slots/" + slotId, null, Void.class, 204);

            // Assert - Verify deletion
            assertThat(interviewSlotRepository.findById(slotId)).isEmpty();
        }

        @Test
        void deleteSlotWithNonExistentIdReturns404() {
            // Arrange
            UUID nonExistentSlotId = UUID.randomUUID();

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .deleteAndRead("/api/interviews/slots/" + nonExistentSlotId, null, Void.class, 404);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void deleteSlotForOtherProfessorReturnsForbidden() {
            // Arrange - Create a slot
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(14, 0),
                LocalTime.of(15, 0),
                "Room 201",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            List<InterviewSlotDTO> createdSlots = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            UUID slotId = createdSlots.get(0).id();

            // Create another professor in different research group
            User otherProfessor = createOtherProfessor();

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
                .deleteAndRead("/api/interviews/slots/" + slotId, null, Void.class, 403);

            // Assert
            assertThat(result).isNull();
            assertThat(interviewSlotRepository.findById(slotId)).isPresent(); // Slot still exists
        }

        @Test
        void deleteBookedSlotReturnsBadRequest() {
            // Arrange - Create a slot and book it
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(14, 0),
                LocalTime.of(15, 0),
                "Room 201",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            List<InterviewSlotDTO> createdSlots = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            UUID slotId = createdSlots.get(0).id();

            // Manually mark slot as booked
            InterviewSlot slot = interviewSlotRepository.findById(slotId).orElseThrow();
            slot.setIsBooked(true);
            interviewSlotRepository.save(slot);

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .deleteAndRead("/api/interviews/slots/" + slotId, null, Void.class, 400);

            // Assert
            assertThat(result).isNull();
            assertThat(interviewSlotRepository.findById(slotId)).isPresent(); // Slot still exists
        }
    }

    // ==================== ADD APPLICANTS TO INTERVIEW TESTS ====================

    @Nested
    class AddApplicantsToInterview {

        @Test
        void addApplicantsToInterviewReturnsCreatedInterviewees() {
            // Arrange - Create applicant and application
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            AddIntervieweesDTO dto = new AddIntervieweesDTO(List.of(application.getApplicationId()));

            // Act
            List<IntervieweeDTO> result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    dto,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    201
                );

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).applicationId()).isEqualTo(application.getApplicationId());
            assertThat(result.get(0).user()).isNotNull();
            assertThat(result.get(0).user().email()).isEqualTo(applicant.getUser().getEmail());
            assertThat(result.get(0).user().firstName()).isEqualTo(applicant.getUser().getFirstName());
            assertThat(result.get(0).user().lastName()).isEqualTo(applicant.getUser().getLastName());

            // Verify persistence
            assertThat(intervieweeRepository.findByInterviewProcessIdWithDetails(interviewProcess.getId())).hasSize(1);
        }

        @Test
        void addApplicantsToInterviewSkipsDuplicates() {
            // Arrange - Create applicant and application
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            AddIntervieweesDTO dto = new AddIntervieweesDTO(List.of(application.getApplicationId()));

            // First call - should create interviewee
            List<IntervieweeDTO> firstResult = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    dto,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    201
                );

            assertThat(firstResult).hasSize(1);

            // Act - Second call with same application ID should skip
            List<IntervieweeDTO> secondResult = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    dto,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    201
                );

            // Assert
            assertThat(secondResult).isEmpty(); // No new interviewees created
            assertThat(intervieweeRepository.findByInterviewProcessIdWithDetails(interviewProcess.getId())).hasSize(1);
        }

        @Test
        void addApplicantsToInterviewAsEmployeeReturnsCreatedInterviewees() {
            // Arrange - Create applicant and application
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            AddIntervieweesDTO dto = new AddIntervieweesDTO(List.of(application.getApplicationId()));

            // Act
            List<IntervieweeDTO> result = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    dto,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    201
                );

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        void addApplicantsToInterviewForNonExistentProcessReturns404() {
            // Arrange
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            AddIntervieweesDTO dto = new AddIntervieweesDTO(List.of(application.getApplicationId()));
            UUID nonExistentProcessId = UUID.randomUUID();

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/processes/" + nonExistentProcessId + "/interviewees", dto, Void.class, 404);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void addApplicantsToInterviewForOtherProfessorReturnsForbidden() {
            // Arrange - Create applicant and application
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            AddIntervieweesDTO dto = new AddIntervieweesDTO(List.of(application.getApplicationId()));

            // Create another professor in different research group
            ResearchGroup otherResearchGroup = ResearchGroupTestData.savedAll(
                researchGroupRepository,
                "Other Group 2",
                "Prof. Other",
                "other2@example.com",
                "OT2",
                "CS",
                "Other research",
                "other2@example.com",
                "80333",
                "CIT",
                "Other Street 2",
                "https://other2.tum.de",
                "ACTIVE"
            );

            User otherProfessor = UserTestData.savedProfessorAll(
                userRepository,
                otherResearchGroup,
                null,
                "other2.prof@tum.de",
                "Another",
                "Prof",
                "en",
                "+49 89 9999",
                "https://another.tum.de",
                "https://linkedin.com/in/another",
                "DE",
                null,
                "männlich",
                UUID.randomUUID().toString().replace("-", "").substring(0, 7)
            );

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/interviewees", dto, Void.class, 403);

            // Assert
            assertThat(result).isNull();
        }
    }

    // ==================== GET INTERVIEWEES BY PROCESS ID TESTS
    // ====================

    @Nested
    class GetIntervieweesByProcessId {

        @Test
        void getIntervieweesByProcessIdReturnsInterviewees() {
            // Arrange - Create applicants and add them to interview
            Applicant applicant1 = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application1 = ApplicationTestData.savedSent(applicationRepository, job, applicant1);

            Applicant applicant2 = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application2 = ApplicationTestData.savedSent(applicationRepository, job, applicant2);

            AddIntervieweesDTO addDto = new AddIntervieweesDTO(List.of(application1.getApplicationId(), application2.getApplicationId()));

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    addDto,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    201
                );

            // Act
            List<IntervieweeDTO> result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    null,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    200
                );

            // Assert
            assertThat(result).hasSize(2);
            assertThat(result)
                .extracting(IntervieweeDTO::user)
                .extracting(IntervieweeDTO.IntervieweeUserDTO::email)
                .containsExactlyInAnyOrder(applicant1.getUser().getEmail(), applicant2.getUser().getEmail());
        }

        @Test
        void getIntervieweesByProcessIdAsEmployeeReturnsInterviewees() {
            // Arrange - Create applicant and add to interview
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);
            AddIntervieweesDTO addDto = new AddIntervieweesDTO(List.of(application.getApplicationId()));

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    addDto,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    201
                );

            // Act
            List<IntervieweeDTO> result = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    null,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    200
                );

            // Assert
            assertThat(result).hasSize(1);
        }

        @Test
        void getIntervieweesByProcessIdReturnsIntervieweeWithScheduledSlot() {
            // Arrange - Create applicant and add to interview
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            AddIntervieweesDTO addDto = new AddIntervieweesDTO(List.of(application.getApplicationId()));

            List<IntervieweeDTO> addedInterviewees = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    addDto,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    201
                );

            UUID intervieweeId = addedInterviewees.get(0).id();

            // Create a slot and assign it to the interviewee
            CreateSlotsDTO.SlotInput slotInput = new CreateSlotsDTO.SlotInput(
                LocalDate.now().plusDays(1),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                "Room 101",
                null
            );
            CreateSlotsDTO dto = new CreateSlotsDTO(List.of(slotInput));

            List<InterviewSlotDTO> createdSlots = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/slots/create",
                    dto,
                    new TypeReference<List<InterviewSlotDTO>>() {},
                    201
                );

            // Assign the slot to the interviewee directly in DB
            InterviewSlot slot = interviewSlotRepository.findById(createdSlots.get(0).id()).orElseThrow();
            de.tum.cit.aet.interview.domain.Interviewee interviewee = intervieweeRepository.findById(intervieweeId).orElseThrow();
            slot.setInterviewee(interviewee);
            slot.setIsBooked(true);
            interviewSlotRepository.save(slot);

            // Act
            List<IntervieweeDTO> result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    null,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    200
                );

            // Assert - Interviewee should have scheduled slot info
            assertThat(result).hasSize(1);
            IntervieweeDTO intervieweeDTO = result.get(0);
            assertThat(intervieweeDTO.scheduledSlot()).isNotNull();
            assertThat(intervieweeDTO.scheduledSlot().id()).isEqualTo(slot.getId());
            assertThat(intervieweeDTO.scheduledSlot().location()).isEqualTo("Room 101");
            assertThat(intervieweeDTO.scheduledSlot().isBooked()).isTrue();

            // Verify exact time values
            LocalDateTime expectedStart = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(10, 0));
            LocalDateTime expectedEnd = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(11, 0));
            assertThat(intervieweeDTO.scheduledSlot().startDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(
                expectedStart
            );
            assertThat(intervieweeDTO.scheduledSlot().endDateTime().atZone(ZoneId.of("Europe/Berlin")).toLocalDateTime()).isEqualTo(
                expectedEnd
            );
        }

        @Test
        void getIntervieweesByProcessIdReturnsEmptyListWhenNoInterviewees() {
            // Act - No interviewees added
            List<IntervieweeDTO> result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees",
                    null,
                    new TypeReference<List<IntervieweeDTO>>() {},
                    200
                );

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        void getIntervieweesByProcessIdForNonExistentProcessReturns404() {
            // Arrange
            UUID nonExistentProcessId = UUID.randomUUID();

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/processes/" + nonExistentProcessId + "/interviewees", null, Void.class, 404);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void getIntervieweesByProcessIdForOtherProfessorReturnsForbidden() {
            // Arrange - Create another professor in different research group
            ResearchGroup otherResearchGroup = ResearchGroupTestData.savedAll(
                researchGroupRepository,
                "Other Group 3",
                "Prof. Other",
                "other3@example.com",
                "OT3",
                "CS",
                "Other research",
                "other3@example.com",
                "80333",
                "CIT",
                "Other Street 3",
                "https://other3.tum.de",
                "ACTIVE"
            );

            User otherProfessor = UserTestData.savedProfessorAll(
                userRepository,
                otherResearchGroup,
                null,
                "other3.prof@tum.de",
                "Third",
                "Other",
                "en",
                "+49 89 3333",
                "https://third.tum.de",
                "https://linkedin.com/in/third",
                "DE",
                null,
                "weiblich",
                UUID.randomUUID().toString().replace("-", "").substring(0, 7)
            );

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/interviewees", null, Void.class, 403);

            // Assert
            assertThat(result).isNull();
        }
    }
}
