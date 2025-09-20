    package de.tum.cit.aet.job.web.rest;

    import static java.util.Map.entry;
    import static org.assertj.core.api.Assertions.assertThat;
    import static org.assertj.core.api.Assertions.assertThatThrownBy;

    import de.tum.cit.aet.core.service.CurrentUserService;
    import de.tum.cit.aet.job.constants.Campus;
    import de.tum.cit.aet.job.constants.FundingType;
    import de.tum.cit.aet.job.constants.JobState;
    import de.tum.cit.aet.job.domain.Job;
    import de.tum.cit.aet.job.dto.*;
    import de.tum.cit.aet.job.repository.JobRepository;
    import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
    import de.tum.cit.aet.usermanagement.domain.User;
    import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
    import de.tum.cit.aet.usermanagement.repository.UserRepository;
    import java.time.LocalDate;
    import java.util.Map;
    import java.util.UUID;

    import de.tum.cit.aet.utility.*;
    import de.tum.cit.aet.utility.MvcTestClient;

    import de.tum.cit.aet.utility.testDataGeneration.JobTestData;
    import de.tum.cit.aet.utility.testDataGeneration.ResearchGroupTestData;
    import de.tum.cit.aet.utility.testDataGeneration.UserTestData;
    import org.junit.jupiter.api.BeforeEach;
    import org.junit.jupiter.api.Test;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
    import org.springframework.boot.test.context.SpringBootTest;
    import com.fasterxml.jackson.core.type.TypeReference;
    import org.springframework.security.test.context.support.WithMockUser;
    import org.springframework.test.context.ActiveProfiles;
    import org.springframework.test.context.bean.override.mockito.MockitoBean;
    import org.springframework.test.web.servlet.MockMvc;

    import com.fasterxml.jackson.databind.ObjectMapper;

    import static org.mockito.Mockito.when;

    @SpringBootTest
    @AutoConfigureMockMvc
    @ActiveProfiles("test")
    class JobResourceTest {

        @Autowired
        MockMvc mockMvc;

        @Autowired
        ObjectMapper objectMapper;

        @Autowired
        JobRepository jobRepository;

        @Autowired
        UserRepository userRepository;

        @Autowired
        ResearchGroupRepository researchGroupRepository;

        @MockitoBean
        CurrentUserService currentUserService;

        MvcTestClient api;
        ResearchGroup researchGroup;
        User professor;

        @BeforeEach
        void setup() {
            api = new MvcTestClient(mockMvc, objectMapper);

            jobRepository.deleteAll();
            userRepository.deleteAll();
            researchGroupRepository.deleteAll();

            researchGroup = ResearchGroupTestData.savedAll(
                researchGroupRepository,
                "Algorithms Group", "Prof. Doe", "alg@example.com", "ALG",
                "CS", "We do cool stuff", "alg@example.com",
                "80333", "CIT", "Arcisstr. 21", "https://alg.tum.de"
            );

            professor = UserTestData.savedProfessorAll(
                userRepository, researchGroup,
                null, "prof.doe@tum.de", "John", "Doe", "en",
                "+49 89 1234", "https://doe.tum.de", "https://linkedin.com/in/doe",
                "DE", null, "männlich"
            );

            JobTestData.saved(jobRepository, professor, researchGroup, "Published Role", JobState.PUBLISHED, LocalDate.of(2025, 9, 1));
            JobTestData.saved(jobRepository, professor, researchGroup, "Draft Role",     JobState.DRAFT,     LocalDate.of(2025,10, 1));

            when(currentUserService.getUserId()).thenReturn(professor.getUserId());
        }

        @Test
        void getAvailableJobsOnlyPublishedOnes() {
            PageResponse<JobCardDTO> page = api.getAndReadOk(
                "/api/jobs/available",
                Map.of("pageNumber", "0", "pageSize", "10"),
                new TypeReference<>() {
                }
            );

            assertThat(page.totalElements()).isEqualTo(1);
            assertThat(page.content()).hasSize(1);
            assertThat(page.number()).isEqualTo(0);
            assertThat(page.size()).isEqualTo(10);

            JobCardDTO card = page.content().getFirst();
            assertThat(card.title()).isEqualTo("Published Role");
            assertThat(card.fieldOfStudies()).isEqualTo("CS");
            assertThat(card.location()).isEqualTo("Garching");
            assertThat(card.professorName()).isEqualTo("John Doe");
            assertThat(card.workload()).isEqualTo(20);
            assertThat(card.startDate()).isEqualTo(LocalDate.of(2025, 9, 1));
        }

        @Test
        void getAvailableJobsInvalidPaginationReturnsError() {
            assertThatThrownBy(() ->
                api.getAndReadOk("/api/jobs/available",
                    Map.of("pageNumber", "-1", "pageSize", "10"),
                    new TypeReference<>() {})
            ).isInstanceOf(AssertionError.class);
        }

        @Test
        @WithMockUser
        void createJobPersistsAndReturnsIt() {
            JobFormDTO payload = new JobFormDTO(
                null, "ML Engineer", "Machine Learning", "CS",
                professor.getUserId(), Campus.GARCHING,
                LocalDate.of(2025,11,1), LocalDate.of(2026,5,31),
                40, 12, FundingType.FULLY_FUNDED,
                "Build ML pipelines", "data cleaning and model training",
                "Python and TensorFlow", JobState.PUBLISHED
            );

            JobFormDTO returned = api.postAndReadOk("/api/jobs/create", payload, JobFormDTO.class);

            assertThat(returned.jobId()).isNotNull();
            assertThat(returned)
                .usingRecursiveComparison()
                .ignoringFields("jobId")
                .isEqualTo(payload);

            Job saved = jobRepository.findById(returned.jobId()).orElseThrow();
            assertThat(saved).extracting(
                Job::getTitle,
                Job::getResearchArea,
                Job::getFieldOfStudies,
                (Job j) -> j.getSupervisingProfessor().getUserId(),
                Job::getLocation,
                Job::getStartDate,
                Job::getEndDate,
                Job::getWorkload,
                Job::getContractDuration,
                Job::getFundingType,
                Job::getDescription,
                Job::getTasks,
                Job::getRequirements,
                Job::getState
            ).containsExactly(
                "ML Engineer",
                "Machine Learning",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.of(2025,11,1),
                LocalDate.of(2026,5,31),
                40,
                12,
                FundingType.FULLY_FUNDED,
                "Build ML pipelines",
                "data cleaning and model training",
                "Python and TensorFlow",
                JobState.PUBLISHED
            );
        }

        @Test
        @WithMockUser
        void createJobInvalidDoesNotPersist() {
            long before = jobRepository.count();

            Map<String, Object> invalid = Map.ofEntries(
                entry("title", "Bad Job"),
                entry("researchArea", "Machine Learning"),
                entry("fieldOfStudies", "CS"),
                entry("supervisingProfessor", professor.getUserId().toString()),
                entry("location", "GARCHING"),
                entry("startDate", "2025-11-01"),
                entry("endDate", "2026-05-31"),
                entry("workload", "oops"),
                entry("contractDuration", 12),
                entry("fundingType", "FULLY_FUNDED"),
                entry("description", "desc"),
                entry("tasks", "tasks"),
                entry("requirements", "req"),
                entry("state", "PUBLISHED")
            );

            assertThatThrownBy(() ->
                api.postAndReadOk("/api/jobs/create", invalid, JobFormDTO.class)
            ).isInstanceOf(AssertionError.class);

            assertThat(jobRepository.count()).isEqualTo(before);
        }

        @Test
        @WithMockUser
        void updateJobUpdatesCorrectly() {

            Job job = jobRepository.findAll().getFirst();

            JobFormDTO updatedPayload = new JobFormDTO(
                job.getJobId(), "Updated Title", "Updated Area", "Updated Field",
                professor.getUserId(), Campus.GARCHING_HOCHBRUECK,
                LocalDate.of(2025,12,1), LocalDate.of(2026,6,30),
                30, 6, FundingType.PARTIALLY_FUNDED,
                "Updated Description", "Updated Tasks",
                "Updated Requirements", JobState.DRAFT
            );

            api.putAndReadOk("/api/jobs/update/" + job.getJobId(), updatedPayload, JobFormDTO.class);

            Job updatedJob = jobRepository.findById(job.getJobId()).orElseThrow();

            assertThat(updatedJob.getTitle()).isEqualTo(updatedPayload.title());
            assertThat(updatedJob.getResearchArea()).isEqualTo(updatedPayload.researchArea());
            assertThat(updatedJob.getFieldOfStudies()).isEqualTo(updatedPayload.fieldOfStudies());
            assertThat(updatedJob.getSupervisingProfessor().getUserId()).isEqualTo(updatedPayload.supervisingProfessor());
            assertThat(updatedJob.getLocation()).isEqualTo(updatedPayload.location());
            assertThat(updatedJob.getStartDate()).isEqualTo(updatedPayload.startDate());
            assertThat(updatedJob.getEndDate()).isEqualTo(updatedPayload.endDate());
            assertThat(updatedJob.getWorkload()).isEqualTo(updatedPayload.workload());
            assertThat(updatedJob.getContractDuration()).isEqualTo(updatedPayload.contractDuration());
            assertThat(updatedJob.getFundingType()).isEqualTo(updatedPayload.fundingType());
            assertThat(updatedJob.getDescription()).isEqualTo(updatedPayload.description());
            assertThat(updatedJob.getTasks()).isEqualTo(updatedPayload.tasks());
            assertThat(updatedJob.getRequirements()).isEqualTo(updatedPayload.requirements());
            assertThat(updatedJob.getState()).isEqualTo(updatedPayload.state());
        }

        @Test
        @WithMockUser
        void updateJobNonexistentJobThrowsNotFound() {
            JobFormDTO updatedPayload = new JobFormDTO(
                UUID.randomUUID(), "Ghost Job", "Area", "Field",
                professor.getUserId(), Campus.GARCHING,
                LocalDate.now(), LocalDate.now().plusMonths(6),
                20, 6, FundingType.FULLY_FUNDED,
                "desc", "tasks", "req", JobState.DRAFT
            );

            assertThatThrownBy(() ->
                api.putAndReadOk("/api/jobs/update/" + updatedPayload.jobId(), updatedPayload, JobFormDTO.class)
            ).isInstanceOf(AssertionError.class);
        }

        @Test
        @WithMockUser
        void deleteJobRemovesIt() {
            Job job = jobRepository.findAll().getFirst();
            assertThat(jobRepository.existsById(job.getJobId())).isTrue();

            api.deleteAndReadOk("/api/jobs/" + job.getJobId(), null, Void.class);

            assertThat(jobRepository.existsById(job.getJobId())).isFalse();
        }

        @Test
        @WithMockUser
        void deleteJobNonexistentJobThrowsNotFound() {
            assertThatThrownBy(() ->
                api.deleteAndReadOk("/api/jobs/" + UUID.randomUUID(), null, Void.class)
            ).isInstanceOf(AssertionError.class);
        }

        @Test
        @WithMockUser
        void changeJobStateUpdatesIt() {
            Job job = jobRepository.findAll().getFirst();
            assertThat(job.getState()).isEqualTo(JobState.PUBLISHED);

            api.putAndReadOk(
                "/api/jobs/changeState/" + job.getJobId() + "?jobState=CLOSED&shouldRejectRemainingApplications=true",
                null,
                JobFormDTO.class
            );

            Job updatedJob = jobRepository.findById(job.getJobId()).orElseThrow();
            assertThat(updatedJob.getState()).isEqualTo(JobState.CLOSED);
        }

        @Test
        @WithMockUser
        void changeJobStateNonExistantJobThrowsNotFound() {
            assertThatThrownBy(() ->
                api.putAndReadOk("/api/jobs/changeState/" + UUID.randomUUID() + "?jobState=CLOSED&shouldRejectRemainingApplications=true",
                    null,
                    JobFormDTO.class
                )
            ).isInstanceOf(AssertionError.class);
        }

        @Test
        @WithMockUser(roles = "PROFESSOR")
        void getJobsByProfessorReturnsJobsCreatedByProfessor() {

            PageResponse<CreatedJobDTO> page = api.getAndReadOk(
                "/api/jobs/professor",
                Map.of("pageNumber", "0", "pageSize", "10"),
                new TypeReference<>() {
                }
            );
            assertThat(page.totalElements()).isEqualTo(2);

        }

        @Test
        @WithMockUser(roles = "PROFESSOR")
        void getJobsByProfessorInvalidPaginationReturnsError() {
            assertThatThrownBy(() ->
                api.getAndReadOk("/api/jobs/professor",
                    Map.of("pageNumber", "-1", "pageSize", "10"),
                    new TypeReference<>() {})
            ).isInstanceOf(AssertionError.class);
        }

        @Test
        @WithMockUser
        void getJobByIdReturnsCorrectJob() {
            Job job = jobRepository.findAll().getFirst();

            JobDTO returnedJob = api.getAndReadOk("/api/jobs/" + job.getJobId(), null, JobDTO.class);

            assertThat(returnedJob.jobId()).isEqualTo(job.getJobId());
            assertThat(returnedJob.title()).isEqualTo(job.getTitle());
            assertThat(returnedJob.researchArea()).isEqualTo(job.getResearchArea());
            assertThat(returnedJob.fieldOfStudies()).isEqualTo(job.getFieldOfStudies());
            assertThat(returnedJob.supervisingProfessor()).isEqualTo(job.getSupervisingProfessor().getUserId());
            assertThat(returnedJob.location()).isEqualTo(job.getLocation());
            assertThat(returnedJob.startDate()).isEqualTo(job.getStartDate());
            assertThat(returnedJob.endDate()).isEqualTo(job.getEndDate());
            assertThat(returnedJob.workload()).isEqualTo(job.getWorkload());
            assertThat(returnedJob.contractDuration()).isEqualTo(job.getContractDuration());
            assertThat(returnedJob.fundingType()).isEqualTo(job.getFundingType());
            assertThat(returnedJob.description()).isEqualTo(job.getDescription());
            assertThat(returnedJob.tasks()).isEqualTo(job.getTasks());
            assertThat(returnedJob.requirements()).isEqualTo(job.getRequirements());
            assertThat(returnedJob.state()).isEqualTo(job.getState());
        }

        @Test
        @WithMockUser
        void getJobByIdNonExistentJobThrowsNotFound() {
            assertThatThrownBy(() ->
                api.getAndReadOk("/api/jobs/" + UUID.randomUUID(), null, JobDTO.class)
            ).isInstanceOf(AssertionError.class);
        }

        @Test
        void getJobDetailsReturnsCorrectJobDetails() {
            Job job = jobRepository.findAll().getFirst();

            JobDetailDTO returnedJob = api.getAndReadOk("/api/jobs/detail/" + job.getJobId(), null, JobDetailDTO.class);

            assertThat(returnedJob.jobId()).isEqualTo(job.getJobId());
            assertThat(returnedJob.supervisingProfessorName()).isEqualTo(job.getSupervisingProfessor().getFirstName() + " " + job.getSupervisingProfessor().getLastName());
            assertThat(returnedJob.researchGroup().getResearchGroupId()).isEqualTo(job.getResearchGroup().getResearchGroupId());
            assertThat(returnedJob.title()).isEqualTo(job.getTitle());
            assertThat(returnedJob.fieldOfStudies()).isEqualTo(job.getFieldOfStudies());
            assertThat(returnedJob.researchArea()).isEqualTo(job.getResearchArea());
            assertThat(returnedJob.location()).isEqualTo("Garching");
            assertThat(returnedJob.workload()).isEqualTo(job.getWorkload());
            assertThat(returnedJob.contractDuration()).isEqualTo(job.getContractDuration());
            assertThat(returnedJob.fundingType()).isEqualTo(job.getFundingType());
            assertThat(returnedJob.description()).isEqualTo(job.getDescription());
            assertThat(returnedJob.tasks()).isEqualTo(job.getTasks());
            assertThat(returnedJob.requirements()).isEqualTo(job.getRequirements());
            assertThat(returnedJob.startDate()).isEqualTo(job.getStartDate());
            assertThat(returnedJob.endDate()).isEqualTo(job.getEndDate());
            assertThat(returnedJob.createdAt()).isEqualTo(job.getCreatedAt());
            assertThat(returnedJob.lastModifiedAt()).isEqualTo(job.getLastModifiedAt());
            assertThat(returnedJob.state()).isEqualTo(job.getState());
        }

        @Test
        void getJobDetailsNonExistantIdThrowsNotFound() {
            assertThatThrownBy(() ->
                api.getAndReadOk("/api/jobs/detail/" + UUID.randomUUID(),
                    null,
                    JobDetailDTO.class)
            ).isInstanceOf(AssertionError.class);
        }
    }
