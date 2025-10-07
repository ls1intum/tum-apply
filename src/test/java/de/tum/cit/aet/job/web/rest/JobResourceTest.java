package de.tum.cit.aet.job.web.rest;

import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
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
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.PageResponse;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.test.context.support.WithMockUser;

class JobResourceTest extends AbstractResourceTest {

    @Autowired
    JobRepository jobRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    ResearchGroup researchGroup;
    User professor;

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
            "https://alg.tum.de"
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
        api = api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"));

        JobTestData.saved(jobRepository, professor, researchGroup, "Published Role", JobState.PUBLISHED, LocalDate.of(2025, 9, 1));
        JobTestData.saved(jobRepository, professor, researchGroup, "Draft Role", JobState.DRAFT, LocalDate.of(2025, 10, 1));
    }

    @Test
    void getAvailableJobsOnlyPublishedOnes() {
        PageResponse<JobCardDTO> page = api.getAndRead(
            "/api/jobs/available",
            Map.of("pageNumber", "0", "pageSize", "10"),
            new TypeReference<>() {},
            200
        );

        assertThat(page.totalElements()).isEqualTo(1);
        assertThat(page.content()).hasSize(1);
        assertThat(page.number()).isZero();
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
        api.getAndRead("/api/jobs/available", Map.of("pageNumber", "-1", "pageSize", "10"), new TypeReference<>() {}, 400);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void createJobPersistsAndReturnsIt() {
        JobFormDTO payload = new JobFormDTO(
            null,
            "ML Engineer",
            "Machine Learning",
            "CS",
            professor.getUserId(),
            Campus.GARCHING,
            LocalDate.of(2025, 11, 1),
            LocalDate.of(2026, 5, 31),
            40,
            12,
            FundingType.FULLY_FUNDED,
            "Build ML pipelines",
            "data cleaning and model training",
            "Python and TensorFlow",
            JobState.PUBLISHED
        );

        JobFormDTO returned = api.postAndRead("/api/jobs/create", payload, JobFormDTO.class, 200);

        assertThat(returned.jobId()).isNotNull();
        assertThat(returned).usingRecursiveComparison().ignoringFields("jobId").isEqualTo(payload);

        Job saved = jobRepository.findById(returned.jobId()).orElseThrow();
        assertThat(saved)
            .extracting(
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
            )
            .containsExactly(
                "ML Engineer",
                "Machine Learning",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.of(2025, 11, 1),
                LocalDate.of(2026, 5, 31),
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
    @WithMockUser(roles = "PROFESSOR")
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

        api.postAndRead("/api/jobs/create", invalid, JobFormDTO.class, 400);

        assertThat(jobRepository.count()).isEqualTo(before);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateJobUpdatesCorrectly() {
        Job job = jobRepository.findAll().getFirst();

        JobFormDTO updatedPayload = new JobFormDTO(
            job.getJobId(),
            "Updated Title",
            "Updated Area",
            "Updated Field",
            professor.getUserId(),
            Campus.GARCHING_HOCHBRUECK,
            LocalDate.of(2025, 12, 1),
            LocalDate.of(2026, 6, 30),
            30,
            6,
            FundingType.PARTIALLY_FUNDED,
            "Updated Description",
            "Updated Tasks",
            "Updated Requirements",
            JobState.DRAFT
        );

        JobFormDTO returnedJob = api.putAndRead("/api/jobs/update/" + job.getJobId(), updatedPayload, JobFormDTO.class, 200);

        assertThat(returnedJob).usingRecursiveComparison().isEqualTo(updatedPayload);
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
    @WithMockUser(roles = "PROFESSOR")
    void updateJobNonexistentJobThrowsNotFound() {
        JobFormDTO updatedPayload = new JobFormDTO(
            UUID.randomUUID(),
            "Ghost Job",
            "Area",
            "Field",
            professor.getUserId(),
            Campus.GARCHING,
            LocalDate.now(),
            LocalDate.now().plusMonths(6),
            20,
            6,
            FundingType.FULLY_FUNDED,
            "desc",
            "tasks",
            "req",
            JobState.DRAFT
        );

        api.putAndRead("/api/jobs/update/" + updatedPayload.jobId(), updatedPayload, JobFormDTO.class, 404);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void deleteJobRemovesIt() {
        Job job = jobRepository.findAll().getFirst();
        assertThat(jobRepository.existsById(job.getJobId())).isTrue();

        api.deleteAndRead("/api/jobs/" + job.getJobId(), null, Void.class, 204);

        assertThat(jobRepository.existsById(job.getJobId())).isFalse();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void deleteJobNonexistentJobThrowsNotFound() {
        api.deleteAndRead("/api/jobs/" + UUID.randomUUID(), null, Void.class, 404);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void changeJobStateUpdatesIt() {
        Job job = jobRepository.findAll().getFirst();
        assertThat(job.getState()).isEqualTo(JobState.PUBLISHED);

        JobFormDTO returnedJob = api.putAndRead(
            "/api/jobs/changeState/" + job.getJobId() + "?jobState=CLOSED&shouldRejectRemainingApplications=true",
            null,
            JobFormDTO.class,
            200
        );

        assertThat(returnedJob.jobId()).isEqualTo(job.getJobId());

        Job updatedJob = jobRepository.findById(job.getJobId()).orElseThrow();
        assertThat(updatedJob.getState()).isEqualTo(JobState.CLOSED);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void changeJobStateNonExistantJobThrowsNotFound() {
        api.putAndRead(
            "/api/jobs/changeState/" + UUID.randomUUID() + "?jobState=CLOSED&shouldRejectRemainingApplications=true",
            null,
            JobFormDTO.class,
            404
        );
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getJobsByProfessor_returnsJobsCreatedByProfessor() {
        PageResponse<CreatedJobDTO> page = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/jobs/professor", Map.of("pageNumber", "0", "pageSize", "10"), new TypeReference<>() {}, 200);
        assertThat(page.totalElements()).isEqualTo(2);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getJobsByProfessorInvalidPaginationReturnsError() {
        api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead("/api/jobs/professor", Map.of("pageNumber", "-1", "pageSize", "10"), new TypeReference<>() {}, 400);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getJobByIdReturnsCorrectJob() {
        Job job = jobRepository.findAll().getFirst();

        JobDTO returnedJob = api.getAndRead("/api/jobs/" + job.getJobId(), null, JobDTO.class, 200);

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
    @WithMockUser(roles = "PROFESSOR")
    void getJobByIdNonExistentJobThrowsNotFound() {
        api.getAndRead("/api/jobs/" + UUID.randomUUID(), null, JobDTO.class, 404);
    }

    @Test
    void getJobDetailsReturnsCorrectJobDetails() {
        Job job = jobRepository.findAll().getFirst();

        JobDetailDTO returnedJob = api.getAndRead("/api/jobs/detail/" + job.getJobId(), null, JobDetailDTO.class, 200);

        assertThat(returnedJob.jobId()).isEqualTo(job.getJobId());
        assertThat(returnedJob.supervisingProfessorName()).isEqualTo(
            job.getSupervisingProfessor().getFirstName() + " " + job.getSupervisingProfessor().getLastName()
        );
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
        api.getAndRead("/api/jobs/detail/" + UUID.randomUUID(), null, JobDetailDTO.class, 404);
    }
}
