package de.tum.cit.aet.job.web.rest;

import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.LocalDate;
import java.util.Map;

import de.tum.cit.aet.utility.*;
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
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class JobResourceTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JobRepository jobRepository;
    @Autowired UserRepository userRepository;
    @Autowired ResearchGroupRepository researchGroupRepository;

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
    }

    @Test
    void getAvailableJobs_onlyPublishedOnes() {
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
    @WithMockUser
    void createJob_persistsAndReturnsIt() {
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
    void createJobInvalid_DoesNotPersist() {
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

}
