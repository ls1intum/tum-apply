package de.tum.cit.aet.application.web.rest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDocumentIdsDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.testDataGeneration.ApplicantTestData;
import de.tum.cit.aet.utility.testDataGeneration.ApplicationTestData;
import de.tum.cit.aet.utility.testDataGeneration.JobTestData;
import de.tum.cit.aet.utility.testDataGeneration.ResearchGroupTestData;
import de.tum.cit.aet.utility.testDataGeneration.UserTestData;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApplicationResourceTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired JobRepository jobRepository;
    @Autowired ApplicationRepository applicationRepository;
    @Autowired ApplicantRepository applicantRepository;
    @Autowired UserRepository userRepository;
    @Autowired ResearchGroupRepository researchGroupRepository;

    MvcTestClient api;

    private ResearchGroup researchGroup;
    private Applicant applicant;
    private User professor;
    private Job job;
    private Application application;

    @BeforeEach
    void setup() {
        api = new MvcTestClient(mockMvc, objectMapper);

        applicationRepository.deleteAll();
        jobRepository.deleteAll();
        userRepository.deleteAll();
        researchGroupRepository.deleteAll();

        researchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "AI Group", "Prof. AI", "ai@example.com", "AI",
            "CS", "AI Research", "ai@example.com",
            "80333", "CIT", "Arcisstr. 21", "https://ai.tum.de"
        );

        applicant = ApplicantTestData.savedApplicant(userRepository, applicantRepository);
        professor = UserTestData.savedProfessorAll(
            userRepository, researchGroup, null,
            "prof.ai@tum.de", "Alice", "Intelligenz", "en",
            "+49 89 123", "https://ai.tum.de", "https://linkedin.com/in/ai",
            "DE", null, "female"
        );

        job = JobTestData.saved(jobRepository, professor, researchGroup, "Published Role", JobState.PUBLISHED, LocalDate.of(2025, 9, 1));
        application = ApplicationTestData.saved(applicationRepository, applicant, job);
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void createApplication_success() {
        ApplicationForApplicantDTO response = api.postAndReadOk(
            "/api/applications/create/" + job.getJobId(),
            null,
            ApplicationForApplicantDTO.class
        );

        assertThat(response.applicationId()).isNotNull();
        assertThat(response.job().jobId()).isEqualTo(job.getJobId());
        assertThat(response.applicant().user().userId()).isEqualTo(applicant.getUserId());
        assertThat(applicationRepository.findById(response.applicationId())).isPresent();
    }

    @Test
    @WithMockUser
    void getApplicationById_success() {
        ApplicationForApplicantDTO result = api.getAndReadOk(
            "/api/applications/" + application.getApplicationId(),
            Map.of(),
            new TypeReference<>() {}
        );

        assertThat(result.applicationId()).isEqualTo(application.getApplicationId());
    }

    @Test
    @WithMockUser
    void deleteApplication_success() {
        api.deleteAndReadOk(
            "/api/applications/" + application.getApplicationId(),
            null,
            new TypeReference<Void>() {}
        );

        assertThat(applicationRepository.findById(application.getApplicationId())).isEmpty();
    }

    @Test
    @WithMockUser
    void updateApplication_success() {
        UpdateApplicationDTO updateDTO = new UpdateApplicationDTO(
            application.getApplicationId(),
            null,
            LocalDate.now().plusWeeks(4),
            ApplicationState.SENT,
            "Updated project",
            "Updated skills",
            "Updated motivation"
        );

        ApplicationForApplicantDTO response = api.putAndReadOk(
            "/api/applications",
            updateDTO,
            ApplicationForApplicantDTO.class
        );

        assertThat(response.applicationId()).isEqualTo(application.getApplicationId());
        assertThat(response.applicationState()).isEqualTo(ApplicationState.SENT);
        assertThat(response.projects()).isEqualTo("Updated project");
        assertThat(response.specialSkills()).isEqualTo("Updated skills");
        assertThat(response.motivation()).isEqualTo("Updated motivation");
    }

    @Test
    @WithMockUser
    void getAllApplicationsOfApplicant_success() {
        Set<ApplicationForApplicantDTO> result = api.getAndReadOk(
            "/api/applications/applicant/" + applicant.getUserId(),
            new HashMap<>(),
            new TypeReference<>() {}
        );

        assertThat(result).hasSize(1);
        assertThat(result.iterator().next().applicationId()).isEqualTo(application.getApplicationId());
    }

    @Test
    @WithMockUser
    void withdrawApplication_success() {
        api.putAndReadOk("/api/applications/withdraw/" + application.getApplicationId(), new HashMap<>(),
            new TypeReference<>() {});

        Application updated = applicationRepository.findById(application.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.WITHDRAWN);
    }

    @Test
    @WithMockUser
    void getDocumentDictionaryIds_success() {
        ApplicationDocumentIdsDTO result = api.getAndReadOk(
            "/api/applications/getDocumentIds/" + application.getApplicationId(),
            new HashMap<>(),
            new TypeReference<>() {}
        );

        assertThat(result).isNotNull();
        assertThat(result.getCvDocumentDictionaryId()).isNotNull(); // adapt based on setup
    }

}
