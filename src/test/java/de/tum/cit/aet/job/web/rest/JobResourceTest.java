package de.tum.cit.aet.job.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import java.util.UUID;

import de.tum.cit.aet.utility.JobTestData;
import de.tum.cit.aet.utility.ResearchGroupTestData;
import de.tum.cit.aet.utility.UserTestData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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

    private ResearchGroup rg;
    private User prof;

    @BeforeEach
    void setup() {
        // clean in FK order
        jobRepository.deleteAll();
        userRepository.deleteAll();
        researchGroupRepository.deleteAll();

        rg = ResearchGroupTestData.saved(researchGroupRepository);
        prof = UserTestData.savedProfessor(userRepository, rg);

        JobTestData.saved(jobRepository, prof, rg, "Published Role", JobState.PUBLISHED, LocalDate.of(2025, 9, 1));
        JobTestData.saved(jobRepository, prof, rg, "Draft Role",     JobState.DRAFT,     LocalDate.of(2025,10, 1));
    }

    @Test
    @DisplayName("GET /api/jobs/available → only PUBLISHED jobs are returned")
    void getAvailableJobs_onlyPublished() throws Exception {
        mockMvc.perform(get("/api/jobs/available")
                .param("pageNumber", "0")
                .param("pageSize", "10")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].title").value("Published Role"));
    }

    @Test
    @DisplayName("POST /api/jobs/create → persists and returns a JobFormDTO")
    @WithMockUser // no role needed for your setup
    void createJob_persistsAndReturnsIt() throws Exception {
        JobFormDTO payload = new JobFormDTO(
            null,
            "ML Engineer",
            "Machine Learning",
            "CS",
            prof.getUserId(),
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

        var mvcResult = mockMvc.perform(post("/api/jobs/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jobId").exists())
            .andExpect(jsonPath("$.title").value("ML Engineer"))
            .andReturn();

        var returned = objectMapper.readValue(mvcResult.getResponse().getContentAsString(), JobFormDTO.class);

        assertThat(jobRepository.findById(returned.jobId()))
            .isPresent()
            .get()
            .extracting(Job::getTitle, Job::getState)
            .containsExactly("ML Engineer", JobState.PUBLISHED);
    }
}
