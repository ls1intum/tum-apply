package de.tum.cit.aet.interview.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.dto.CreateSlotsDTO;
import de.tum.cit.aet.interview.dto.InterviewOverviewDTO;
import de.tum.cit.aet.interview.dto.InterviewSlotDTO;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
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
    private DatabaseCleaner databaseCleaner;

    @Autowired
    private MvcTestClient api;

    private User professor;
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

        job = JobTestData.saved(jobRepository, professor, researchGroup, "Software Engineer", JobState.PUBLISHED, LocalDate.now());

        interviewProcess = new InterviewProcess();
        interviewProcess.setJob(job);
        interviewProcess = interviewProcessRepository.save(interviewProcess);
    }

    @Test
    void getInterviewProcessDetailsReturnsCorrectDetails() {
        InterviewOverviewDTO details = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/interviews/processes/" + interviewProcess.getId(), null, InterviewOverviewDTO.class, 200);

        assertThat(details.jobId()).isEqualTo(job.getJobId());
        assertThat(details.jobTitle()).isEqualTo(job.getTitle());
        // Stats will be 0 since we didn't create applications
        assertThat(details.totalInterviews()).isZero();
    }

    @Test
    void getInterviewProcessDetailsForbiddenForOtherUser() {
        // Create another professor
        User otherProfessor = UserTestData.savedProfessorAll(
            userRepository,
            researchGroup,
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

        api
            .with(JwtPostProcessors.jwtUser(student.getUserId(), "ROLE_STUDENT"))
            .getAndRead("/api/interviews/overview", null, Void.class, 403);
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
        assertThat(createdSlots.get(0).startDateTime()).isNotNull();
        assertThat(createdSlots.get(0).endDateTime()).isNotNull();
        assertThat(createdSlots.get(0).location()).isEqualTo("Room 101");
        assertThat(createdSlots.get(0).isBooked()).isFalse();

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
        api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/slots/create", dto, Void.class, 409);
    }

    @Test
    void createSlotsWithInvalidDataReturnsBadRequest() {
        // End time before start time is handled by DTO validation, but let's try nulls
        // or invalid constraints if possible
        // The DTO constructor throws InvalidParameterException for end < start, which
        // might result in 400 or 500 depending on exception handler.
        // Let's try missing required fields which triggers @Valid
        CreateSlotsDTO.SlotInput invalidInput = new CreateSlotsDTO.SlotInput(
            null, // date is required
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            "Room 101",
            null
        );
        CreateSlotsDTO dto = new CreateSlotsDTO(List.of(invalidInput));

        api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/slots/create", dto, Void.class, 400);
    }

    @Test
    void createSlotsForOtherProfessorJobReturnsForbidden() {
        User otherProfessor = UserTestData.savedProfessorAll(
            userRepository,
            researchGroup,
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

        api
            .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/slots/create", dto, Void.class, 403);
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

        api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead("/api/interviews/processes/" + UUID.randomUUID() + "/slots/create", dto, Void.class, 404);
    }

    @Test
    void getSlotsByProcessIdAsProfessorReturnsSlots() {
        // Create some slots first
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
        // Verify ordering (ascending)
        assertThat(slots.get(0).startDateTime()).isBefore(slots.get(1).startDateTime());
    }

    @Test
    void getSlotsByProcessIdForOtherProfessorReturnsForbidden() {
        User otherProfessor = UserTestData.savedProfessorAll(
            userRepository,
            researchGroup,
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

        api
            .with(JwtPostProcessors.jwtUser(otherProfessor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/interviews/processes/" + interviewProcess.getId() + "/slots", null, Void.class, 403);
    }

    @Test
    void getSlotsByProcessIdForNonExistentProcessReturnsNotFound() {
        api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/interviews/processes/" + UUID.randomUUID() + "/slots", null, Void.class, 404);
    }
}
