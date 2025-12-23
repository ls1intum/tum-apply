package de.tum.cit.aet.interview.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.core.dto.PageResponseDTO;
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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
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

    @Test
    void getSlotsByProcessIdAndMonthReturnsFilteredSlots() {
        int nextYear = LocalDate.now().plusYears(1).getYear();
        createSlotsForJanuaryAndFebruary(nextYear);

        assertJanuarySlotsFiltered(nextYear);
        assertFebruarySlotsFiltered(nextYear);
        assertMarchSlotsEmpty(nextYear);
    }

    private void createSlotsForJanuaryAndFebruary(int year) {
        LocalDate janDate = LocalDate.of(year, 1, 15);
        LocalDate febDate = LocalDate.of(year, 2, 15);

        CreateSlotsDTO.SlotInput slotInput1 = new CreateSlotsDTO.SlotInput(
            janDate,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            "Room 101",
            null
        );
        CreateSlotsDTO.SlotInput slotInput2 = new CreateSlotsDTO.SlotInput(
            febDate,
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
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
    }

    private void assertJanuarySlotsFiltered(int year) {
        PageResponseDTO<InterviewSlotDTO> response = getSlotsByMonth(year, 1);
        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().iterator().next().location()).isEqualTo("Room 101");
    }

    private void assertFebruarySlotsFiltered(int year) {
        PageResponseDTO<InterviewSlotDTO> response = getSlotsByMonth(year, 2);
        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().iterator().next().location()).isEqualTo("Room 102");
    }

    private void assertMarchSlotsEmpty(int year) {
        PageResponseDTO<InterviewSlotDTO> response = getSlotsByMonth(year, 3);
        assertThat(response.getTotalElements()).isEqualTo(0);
        assertThat(response.getContent()).isEmpty();
    }

    private PageResponseDTO<InterviewSlotDTO> getSlotsByMonth(int year, int month) {
        return api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                "/api/interviews/processes/" + interviewProcess.getId() + "/slots?year=" + year + "&month=" + month,
                null,
                new TypeReference<PageResponseDTO<InterviewSlotDTO>>() {},
                200
            );
    }
}
