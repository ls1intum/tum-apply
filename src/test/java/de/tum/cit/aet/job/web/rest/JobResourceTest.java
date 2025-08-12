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
    @Autowired JobRepository jobRepository;
    @Autowired UserRepository userRepository;
    @Autowired ResearchGroupRepository researchGroupRepository;
    @Autowired ObjectMapper objectMapper;

    private UUID professorId;
    private ResearchGroup rg;

    @BeforeEach
    void setup() {
        // keep FK order to avoid constraint issues
        jobRepository.deleteAll();
        userRepository.deleteAll();
        researchGroupRepository.deleteAll();

        // research group
        rg = new ResearchGroup();
        rg.setHead("Alice");
        rg.setName("Test Group");
        rg.setAbbreviation("TG");
        rg.setCity("Testville");
        rg.setDefaultFieldOfStudies("CS");
        rg.setDescription("A test research group");
        rg.setEmail("tg@example.com");
        rg.setPostalCode("12345");
        rg.setSchool("Test University");
        rg.setStreet("123 Main St");
        rg.setWebsite("http://example.com");
        rg = researchGroupRepository.save(rg);

        // professor
        User prof = new User();
        prof.setUserId(UUID.randomUUID());
        prof.setFirstName("Alice");
        prof.setLastName("Smith");
        prof.setEmail("alice.smith@example.com");
        prof.setSelectedLanguage("en");
        prof.setResearchGroup(rg);
        userRepository.save(prof);
        professorId = prof.getUserId();

        // seed jobs used by the GET test
        jobRepository.save(buildJob("Published Role", JobState.PUBLISHED, prof, rg, LocalDate.of(2025, 9, 1)));
        jobRepository.save(buildJob("Draft Role", JobState.DRAFT, prof, rg, LocalDate.of(2025,10, 1)));
    }

    private Job buildJob(String title, JobState state, User prof, ResearchGroup rg, LocalDate start) {
        Job j = new Job();
        j.setTitle(title);
        j.setResearchArea("ML");
        j.setFieldOfStudies("CS");
        j.setLocation(Campus.GARCHING);
        j.setWorkload(20);
        j.setStartDate(start);
        j.setState(state);
        j.setSupervisingProfessor(prof);
        j.setResearchGroup(rg); // important for the NOT NULL FK
        return j;
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
    @WithMockUser()
    void createJob_persistsAndReturnsIt() throws Exception {
        JobFormDTO payload = new JobFormDTO(
            null,
            "ML Engineer",
            "Machine Learning",
            "CS",
            professorId,
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
