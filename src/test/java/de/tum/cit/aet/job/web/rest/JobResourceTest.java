package de.tum.cit.aet.job.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.LocalDate;
import java.util.Map;

import de.tum.cit.aet.utility.JobTestData;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.ResearchGroupTestData;
import de.tum.cit.aet.utility.UserTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
    ResearchGroup rg;
    User prof;

    @BeforeEach
    void setup() {
        api = new MvcTestClient(mockMvc, objectMapper);

        jobRepository.deleteAll();
        userRepository.deleteAll();
        researchGroupRepository.deleteAll();

        rg = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Algorithms Group", "Prof. Doe", "alg@example.com", "ALG",
            "CS", "We do cool stuff", "alg@example.com",
            "80333", "CIT", "Arcisstr. 21", "https://alg.tum.de"
        );

        prof = UserTestData.savedProfessorAll(
            userRepository, rg,
            null, "prof.doe@tum.de", "John", "Doe", "en",
            "+49 89 1234", "https://doe.tum.de", "https://linkedin.com/in/doe",
            "DE", null, "männlich"
        );

        JobTestData.saved(jobRepository, prof, rg, "Published Role", JobState.PUBLISHED, LocalDate.of(2025, 9, 1));
        JobTestData.saved(jobRepository, prof, rg, "Draft Role",     JobState.DRAFT,     LocalDate.of(2025,10, 1));
    }

    @Test
    void getAvailableJobs_onlyPublished() throws Exception {
        api.get("/api/jobs/available", Map.of("pageNumber","0", "pageSize","10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].title").value("Published Role"));
    }

    @Test
    @WithMockUser
    void createJob_persistsAndReturnsIt() throws Exception {
        var payload = new JobFormDTO(
            null, "ML Engineer", "Machine Learning", "CS",
            prof.getUserId(), Campus.GARCHING,
            LocalDate.of(2025,11,1), LocalDate.of(2026,5,31),
            40, 12, FundingType.FULLY_FUNDED,
            "Build ML pipelines", "data cleaning and model training",
            "Python and TensorFlow", JobState.PUBLISHED
        );

        var result = api.postJson("/api/jobs/create", payload)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jobId").exists())
            .andExpect(jsonPath("$.title").value("ML Engineer"))
            .andReturn();

        var returned = api.read(result, JobFormDTO.class);

        assertThat(jobRepository.findById(returned.jobId()))
            .isPresent()
            .get()
            .extracting(Job::getTitle, Job::getState)
            .containsExactly("ML Engineer", JobState.PUBLISHED);
    }
}
