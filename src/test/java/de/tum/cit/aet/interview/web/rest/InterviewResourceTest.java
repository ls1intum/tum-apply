package de.tum.cit.aet.interview.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.domain.enumeration.AssessmentRating;
import de.tum.cit.aet.interview.dto.AssignSlotRequestDTO;
import de.tum.cit.aet.interview.dto.CreateSlotsDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewSlotDTO;
import de.tum.cit.aet.interview.dto.IntervieweeDetailDTO;
import de.tum.cit.aet.interview.dto.SendInvitationsRequestDTO;
import de.tum.cit.aet.interview.dto.SendInvitationsResultDTO;
import de.tum.cit.aet.interview.dto.UpdateAssessmentDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.interview.service.InterviewService;
import de.tum.cit.aet.interview.web.InterviewResource;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;

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
    private IntervieweeRepository intervieweeRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private DatabaseCleaner databaseCleaner;

    @Autowired
    private MvcTestClient api;

    @Autowired
    private InterviewResource interviewResource;

    @Autowired
    private InterviewService interviewService;

    private AsyncEmailSender asyncEmailSenderMock;

    private User professor;
    private User employee;
    private Job job;
    private InterviewProcess interviewProcess;
    private ResearchGroup researchGroup;
    private Applicant testApplicant;
    private Application testApplication;
    private Interviewee testInterviewee;

    @BeforeEach
    void setup() {
        asyncEmailSenderMock = Mockito.mock(AsyncEmailSender.class);
        ReflectionTestUtils.setField(interviewService, "asyncEmailSender", asyncEmailSenderMock);
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

        employee = UserTestData.savedEmployee(
            userRepository,
            researchGroup,
            "emp.smith@tum.de",
            "Emily",
            "Smith",
            UUID.randomUUID().toString().replace("-", "").substring(0, 7)
        );

        job = JobTestData.saved(jobRepository, professor, researchGroup, "Software Engineer", JobState.PUBLISHED, LocalDate.now());

        interviewProcess = new InterviewProcess();
        interviewProcess.setJob(job);
        interviewProcess = interviewProcessRepository.save(interviewProcess);

        // Shared test applicant and interviewee
        testApplicant = ApplicantTestData.savedWithNewUser(applicantRepository);
        testApplication = ApplicationTestData.savedSent(applicationRepository, job, testApplicant);
        testInterviewee = createInterviewee(testApplication);
    }

    @Test
    void getInterviewProcessDetailsReturnsCorrectDetails() {
        InterviewOverviewDTO details = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/interviews/processes/" + interviewProcess.getId(), null, InterviewOverviewDTO.class, 200);

        assertThat(details.jobId()).isEqualTo(job.getJobId());
        assertThat(details.jobTitle()).isEqualTo(job.getTitle());
        // Stats reflects the testInterviewee created in setup
        assertThat(details.totalInterviews()).isEqualTo(1);
    }

    @Test
    void getInterviewProcessDetailsForbiddenForOtherUser() {
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
            .getAndRead("/api/interviews/processes/" + interviewProcess.getId(), null, Void.class, 403);

        assertThat(result).isNull();
    }

    @Test
    void getInterviewProcessDetailsNotFoundForNonExistentId() {
        Void result = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/interviews/processes/" + UUID.randomUUID(), null, Void.class, 404);

        assertThat(result).isNull();
    }

    @Test
    void getInterviewOverviewAsProfessorReturnsOverview() {
        List<InterviewOverviewDTO> overview = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/interviews/overview", null, new TypeReference<List<InterviewOverviewDTO>>() {}, 200);

        assertThat(overview).isNotEmpty();
        assertThat(overview.get(0).jobId()).isEqualTo(job.getJobId());
        assertThat(overview.get(0).jobTitle()).isEqualTo(job.getTitle());
    }

    @Test
    void getInterviewOverviewAsProfessorReturnsEmptyList() {
        // Delete the existing process to simulate no processes
        interviewProcessRepository.deleteAll();

        List<InterviewOverviewDTO> overview = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/interviews/overview", null, new TypeReference<List<InterviewOverviewDTO>>() {}, 200);

        assertThat(overview).isEmpty();
    }

    @Test
    void getInterviewOverviewAsStudentReturnsForbidden() {
        User student = UserTestData.createUserWithoutResearchGroup(userRepository, "student@tum.de", "Student", "One", "123456");

        Void result = api
            .with(JwtPostProcessors.jwtUser(student.getUserId(), "ROLE_STUDENT"))
            .getAndRead("/api/interviews/overview", null, Void.class, 403);

        assertThat(result).isNull();
    }

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

        // Get slots with pagination (add year and month to match server-side filtering)
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        String url =
            "/api/interviews/processes/" +
            interviewProcess.getId() +
            "/slots?year=" +
            tomorrow.getYear() +
            "&month=" +
            tomorrow.getMonthValue();

        PageResponseDTO<InterviewSlotDTO> response = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(url, null, new TypeReference<PageResponseDTO<InterviewSlotDTO>>() {}, 200);

        List<InterviewSlotDTO> slots = new java.util.ArrayList<>(response.getContent());
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
        api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/interviews/processes/" + UUID.randomUUID() + "/slots", null, Void.class, 404);
    }

    @Nested
    class GetIntervieweeDetails {

        @Test
        void getIntervieweeDetailsAsProfessorReturnsFullDetails() {
            // Act - use shared testInterviewee
            IntervieweeDetailDTO result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + testInterviewee.getId(),
                    null,
                    IntervieweeDetailDTO.class,
                    200
                );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(testInterviewee.getId());
            assertThat(result.applicationId()).isEqualTo(testApplication.getApplicationId());
            assertThat(result.user()).isNotNull();
            assertThat(result.user().email()).isEqualTo(testApplicant.getUser().getEmail());
            assertThat(result.application()).isNotNull();
            assertThat(result.application().motivation()).isEqualTo(testApplication.getMotivation());
        }

        @Test
        void getIntervieweeDetailsAsEmployeeReturnsFullDetails() {
            // Act - use employee role
            IntervieweeDetailDTO result = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + testInterviewee.getId(),
                    null,
                    IntervieweeDetailDTO.class,
                    200
                );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(testInterviewee.getId());
            assertThat(result.applicationId()).isEqualTo(testApplication.getApplicationId());
            assertThat(result.user()).isNotNull();
            assertThat(result.user().email()).isEqualTo(testApplicant.getUser().getEmail());
            assertThat(result.application()).isNotNull();
            assertThat(result.application().motivation()).isEqualTo(testApplication.getMotivation());
        }

        @Test
        void getIntervieweeDetailsWithNonExistentIdReturns404() {
            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + UUID.randomUUID(),
                    null,
                    Void.class,
                    404
                );
        }

        @Test
        void getIntervieweeDetailsForOtherProfessorReturns403() {
            User otherProfessor = UserTestData.savedOtherProfessor(userRepository, researchGroupRepository);

            api
                .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + testInterviewee.getId(),
                    null,
                    Void.class,
                    403
                );
        }
    }

    @Nested
    class UpdateAssessment {

        @Test
        void updateAssessmentWithRatingOnlyAsProfessorReturnsUpdatedDetails() {
            // Arrange - create new interviewee since we modify it
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);
            Interviewee interviewee = createInterviewee(application);
            UpdateAssessmentDTO dto = new UpdateAssessmentDTO(2, null, null);

            // Act
            IntervieweeDetailDTO result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + interviewee.getId() + "/assessment",
                    dto,
                    IntervieweeDetailDTO.class,
                    200
                );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.rating()).isEqualTo(2);
            assertThat(result.assessmentNotes()).isNull();

            // Verify persistence
            Interviewee saved = intervieweeRepository.findById(interviewee.getId()).orElseThrow();
            assertThat(saved.getRating()).isEqualTo(AssessmentRating.EXCELLENT);
        }

        @Test
        void updateAssessmentAsEmployeeReturnsUpdatedDetails() {
            // Arrange
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);
            Interviewee interviewee = createInterviewee(application);
            UpdateAssessmentDTO dto = new UpdateAssessmentDTO(1, null, "Good candidate.");

            // Act - use employee role
            IntervieweeDetailDTO result = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .putAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + interviewee.getId() + "/assessment",
                    dto,
                    IntervieweeDetailDTO.class,
                    200
                );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.rating()).isEqualTo(1);
            assertThat(result.assessmentNotes()).isEqualTo("Good candidate.");
        }

        @Test
        void updateAssessmentWithNotesOnlyReturnsUpdatedDetails() {
            // Arrange
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);
            Interviewee interviewee = createInterviewee(application);
            UpdateAssessmentDTO dto = new UpdateAssessmentDTO(null, null, "Good candidate with strong technical skills.");

            // Act
            IntervieweeDetailDTO result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + interviewee.getId() + "/assessment",
                    dto,
                    IntervieweeDetailDTO.class,
                    200
                );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.assessmentNotes()).isEqualTo("Good candidate with strong technical skills.");

            // Verify persistence
            Interviewee saved = intervieweeRepository.findById(interviewee.getId()).orElseThrow();
            assertThat(saved.getAssessmentNotes()).isEqualTo("Good candidate with strong technical skills.");
        }

        @Test
        void updateAssessmentWithClearRatingRemovesRating() {
            // Arrange - create interviewee with existing rating
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);
            Interviewee interviewee = createInterviewee(application);
            interviewee.setRating(AssessmentRating.GOOD);
            intervieweeRepository.save(interviewee);

            UpdateAssessmentDTO dto = new UpdateAssessmentDTO(null, true, null);

            // Act
            IntervieweeDetailDTO result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + interviewee.getId() + "/assessment",
                    dto,
                    IntervieweeDetailDTO.class,
                    200
                );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.rating()).isNull();

            // Verify persistence
            Interviewee saved = intervieweeRepository.findById(interviewee.getId()).orElseThrow();
            assertThat(saved.getRating()).isNull();
        }

        @Test
        void updateAssessmentWithInvalidRatingReturns400() {
            UpdateAssessmentDTO dto = new UpdateAssessmentDTO(5, null, null); // Invalid: > 2

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + testInterviewee.getId() + "/assessment",
                    dto,
                    Void.class,
                    400
                );
        }

        @Test
        void updateAssessmentWithEmptyBodyReturns400() {
            UpdateAssessmentDTO dto = new UpdateAssessmentDTO(null, null, null);

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + testInterviewee.getId() + "/assessment",
                    dto,
                    Void.class,
                    400
                );
        }

        @Test
        void updateAssessmentForNonExistentIntervieweeReturns404() {
            UpdateAssessmentDTO dto = new UpdateAssessmentDTO(1, null, "Test notes");

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + UUID.randomUUID() + "/assessment",
                    dto,
                    Void.class,
                    404
                );
        }

        @Test
        void updateAssessmentForOtherProfessorReturns403() {
            User otherProfessor = UserTestData.savedOtherProfessor(userRepository, researchGroupRepository);
            UpdateAssessmentDTO dto = new UpdateAssessmentDTO(1, null, "Test notes");

            api
                .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/interviewees/" + testInterviewee.getId() + "/assessment",
                    dto,
                    Void.class,
                    403
                );
        }
    }

    // --- Helper methods ---
    private Interviewee createInterviewee(Application application) {
        Interviewee interviewee = new Interviewee();
        interviewee.setInterviewProcess(interviewProcess);
        interviewee.setApplication(application);
        return intervieweeRepository.save(interviewee);
    }

    // ===========================================================================================
    // Tests for assigning Interviewee to slot
    // ===========================================================================================

    @Nested
    class AssignSlotToInterviewee {

        @Test
        void assignSlotSuccessfullyAssignsInterviewee() {
            // Arrange
            InterviewSlot slot = createTestSlot();
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            Interviewee interviewee = new Interviewee();
            interviewee.setInterviewProcess(interviewProcess);
            interviewee.setApplication(application);
            interviewee.setLastInvited(java.time.Instant.now());
            intervieweeRepository.save(interviewee);

            AssignSlotRequestDTO requestDTO = new AssignSlotRequestDTO(application.getApplicationId());

            // Act
            InterviewSlotDTO result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/slots/" + slot.getId() + "/assign", requestDTO, InterviewSlotDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(slot.getId());
            assertThat(result.isBooked()).isTrue();
            assertThat(result.interviewee()).isNotNull();
            assertThat(result.interviewee().applicationId()).isEqualTo(application.getApplicationId());

            // Verify 2 emails sent: 1 to applicant, 1 to professor
            ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);
            verify(asyncEmailSenderMock, times(2)).sendAsync(emailCaptor.capture());

            List<Email> sentEmails = emailCaptor.getAllValues();
            assertThat(sentEmails).hasSize(2);
            assertThat(sentEmails.stream().map(Email::getEmailType)).containsExactlyInAnyOrder(
                EmailType.INTERVIEW_INVITATION,
                EmailType.INTERVIEW_ASSIGNED_PROFESSOR
            );
        }

        @Test
        void assignSlotReturnsNotFoundForNonExistentSlot() {
            // Arrange
            UUID nonExistentSlotId = UUID.randomUUID();
            AssignSlotRequestDTO requestDTO = new AssignSlotRequestDTO(UUID.randomUUID());

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/slots/" + nonExistentSlotId + "/assign", requestDTO, Void.class, 404);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void assignSlotReturnsConflictWhenSlotAlreadyBooked() {
            // Arrange
            InterviewSlot slot = createTestSlot();
            slot.setIsBooked(true);
            interviewSlotRepository.save(slot);

            AssignSlotRequestDTO requestDTO = new AssignSlotRequestDTO(UUID.randomUUID());

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/slots/" + slot.getId() + "/assign", requestDTO, Void.class, 409);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void assignSlotReturnsNotFoundWhenApplicantNotInProcess() {
            // Arrange
            InterviewSlot slot = createTestSlot();
            UUID nonExistentApplicationId = UUID.randomUUID();
            AssignSlotRequestDTO requestDTO = new AssignSlotRequestDTO(nonExistentApplicationId);

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/slots/" + slot.getId() + "/assign", requestDTO, Void.class, 404);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void assignSlotReturnsBadRequestWhenIntervieweeAlreadyHasSlot() {
            // Arrange - Create first slot and assign it
            InterviewSlot slot1 = createTestSlot();
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            Interviewee interviewee = new Interviewee();
            interviewee.setInterviewProcess(interviewProcess);
            interviewee.setApplication(application);
            interviewee.setLastInvited(java.time.Instant.now());
            interviewee = intervieweeRepository.save(interviewee);

            slot1.setInterviewee(interviewee);
            slot1.setIsBooked(true);
            interviewSlotRepository.save(slot1);
            interviewee.getSlots().add(slot1);
            intervieweeRepository.save(interviewee);

            // Arrange - Create second slot
            InterviewSlot slot2 = createTestSlot();
            AssignSlotRequestDTO requestDTO = new AssignSlotRequestDTO(application.getApplicationId());

            // Act
            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/slots/" + slot2.getId() + "/assign", requestDTO, Void.class, 400);

            // Assert
            assertThat(result).isNull();
        }

        @Test
        void assignSlotAsEmployeeSuccessfullyAssignsInterviewee() {
            // Arrange - Create an employee in the same research group
            User employee = UserTestData.savedProfessorAll(
                userRepository,
                researchGroup,
                null,
                "employee@tum.de",
                "Max",
                "Employee",
                "en",
                "+49 89 9999",
                "https://employee.tum.de",
                null,
                "DE",
                null,
                "männlich",
                UUID.randomUUID().toString().replace("-", "").substring(0, 7)
            );

            InterviewSlot slot = createTestSlot();
            Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
            Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

            Interviewee interviewee = new Interviewee();
            interviewee.setInterviewProcess(interviewProcess);
            interviewee.setApplication(application);
            interviewee.setLastInvited(java.time.Instant.now());
            intervieweeRepository.save(interviewee);

            AssignSlotRequestDTO requestDTO = new AssignSlotRequestDTO(application.getApplicationId());

            // Act - Employee role should be allowed by @ProfessorOrEmployee
            InterviewSlotDTO result = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .postAndRead("/api/interviews/slots/" + slot.getId() + "/assign", requestDTO, InterviewSlotDTO.class, 200);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(slot.getId());
            assertThat(result.isBooked()).isTrue();
            assertThat(result.interviewee()).isNotNull();
            assertThat(result.interviewee().applicationId()).isEqualTo(application.getApplicationId());
        }
    }

    // Helper method
    private InterviewSlot createTestSlot() {
        InterviewSlot slot = new InterviewSlot();
        slot.setInterviewProcess(interviewProcess);
        slot.setStartDateTime(java.time.Instant.now().plusSeconds(86400));
        slot.setEndDateTime(java.time.Instant.now().plusSeconds(90000));
        slot.setLocation("Room 101");
        slot.setIsBooked(false);
        return interviewSlotRepository.save(slot);
    }

    // ===========================================================================================
    // Tests for sending self-scheduling invitations
    // ===========================================================================================

    @Nested
    class SendInvitations {

        private Applicant applicant1;
        private Applicant applicant2;
        private Application app1;
        private Application app2;
        private Interviewee interviewee1;
        private Interviewee interviewee2;

        @BeforeEach
        void setupInterviewees() {
            applicant1 = ApplicantTestData.savedWithNewUser(applicantRepository);
            app1 = ApplicationTestData.savedSent(applicationRepository, job, applicant1);
            interviewee1 = new Interviewee();
            interviewee1.setInterviewProcess(interviewProcess);
            interviewee1.setApplication(app1);
            interviewee1 = intervieweeRepository.save(interviewee1);

            applicant2 = ApplicantTestData.savedWithNewUser(applicantRepository);
            app2 = ApplicationTestData.savedSent(applicationRepository, job, applicant2);
            interviewee2 = new Interviewee();
            interviewee2.setInterviewProcess(interviewProcess);
            interviewee2.setApplication(app2);
            interviewee2 = intervieweeRepository.save(interviewee2);
        }

        @Test
        void sendInvitationsSuccessfullySendsEmails() {
            // Arrange
            SendInvitationsRequestDTO requestDTO = new SendInvitationsRequestDTO(false, null);

            // Act
            SendInvitationsResultDTO result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/send-invitations",
                    requestDTO,
                    SendInvitationsResultDTO.class,
                    200
                );

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.sentCount()).isEqualTo(3);
            assertThat(result.failedEmails() == null || result.failedEmails().isEmpty())
                .as("Failed emails should be null or empty")
                .isTrue();

            ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);
            verify(asyncEmailSenderMock, times(3)).sendAsync(emailCaptor.capture());

            List<Email> sentEmails = emailCaptor.getAllValues();
            assertThat(sentEmails).hasSize(3);
            assertThat(sentEmails).allMatch(email -> email.getEmailType() == EmailType.INTERVIEW_SELF_SCHEDULING_INVITATION);
        }

        @Test
        void sendInvitationsWithFilterReturnsCorrectResult() {
            // Arrange: Mark interviewee1 as already invited
            interviewee1.setLastInvited(java.time.Instant.now());
            intervieweeRepository.save(interviewee1);

            SendInvitationsRequestDTO requestDTO = new SendInvitationsRequestDTO(true, null);

            // Act
            SendInvitationsResultDTO result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/send-invitations",
                    requestDTO,
                    SendInvitationsResultDTO.class,
                    200
                );

            // Assert
            assertThat(result.sentCount()).isEqualTo(2);

            ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);
            verify(asyncEmailSenderMock, times(2)).sendAsync(emailCaptor.capture());

            Email sentEmail = emailCaptor.getValue();
            assertThat(sentEmail.getEmailType()).isEqualTo(EmailType.INTERVIEW_SELF_SCHEDULING_INVITATION);
            assertThat(sentEmail.getTo()).hasSize(1);
            assertThat(sentEmail.getTo().iterator().next().getEmail()).isEqualTo(applicant2.getUser().getEmail());
        }

        @Test
        void sendInvitationsIndividualSelection() {
            // Arrange: Select only interviewee1
            SendInvitationsRequestDTO requestDTO = new SendInvitationsRequestDTO(false, List.of(interviewee1.getId()));

            // Act
            SendInvitationsResultDTO result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/interviews/processes/" + interviewProcess.getId() + "/send-invitations",
                    requestDTO,
                    SendInvitationsResultDTO.class,
                    200
                );

            // Assert
            assertThat(result.sentCount()).isEqualTo(1);

            ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);
            verify(asyncEmailSenderMock, times(1)).sendAsync(emailCaptor.capture());

            Email sentEmail = emailCaptor.getValue();
            assertThat(sentEmail.getTo()).hasSize(1);
            assertThat(sentEmail.getTo().iterator().next().getEmail()).isEqualTo(applicant1.getUser().getEmail());
        }

        @Test
        void sendInvitationsReturnsNotFoundForNonExistentProcess() {
            SendInvitationsRequestDTO requestDTO = new SendInvitationsRequestDTO(false, null);
            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/interviews/processes/" + UUID.randomUUID() + "/send-invitations", requestDTO, Void.class, 404);
        }

        @Test
        void sendInvitationsReturnsForbiddenForUnauthorizedUser() {
            SendInvitationsRequestDTO requestDTO = new SendInvitationsRequestDTO(false, null);

            // Create a student/random user
            User student = UserTestData.createUserWithoutResearchGroup(userRepository, "student@tum.de", "Student", "One", "123456");

            api
                .with(JwtPostProcessors.jwtUser(student.getUserId(), "ROLE_STUDENT"))
                .postAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/send-invitations", requestDTO, Void.class, 403);
        }
    }
}
