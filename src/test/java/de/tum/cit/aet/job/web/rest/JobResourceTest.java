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

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResearchGroupRepository researchGroupRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID professorId;

    @BeforeEach
    void cleanDatabaseAndSeedUser() {
        // 1) create & save the research group (ID generated, entity stays managed)
        ResearchGroup rg = new ResearchGroup();
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

        // 2) create & save the professor (pointing at the *same* managed RG)
        UUID id = UUID.randomUUID();
        User prof = new User();
        prof.setUserId(id);
        prof.setFirstName("Alice");
        prof.setLastName("Smith");
        prof.setEmail("alice.smith@example.com");
        prof.setSelectedLanguage("en");
        prof.setResearchGroup(rg);
        userRepository.save(prof);

        professorId = prof.getUserId();
    }

    @Test
    @DisplayName("GET /api/jobs/available → only PUBLISHED jobs are returned")
    @WithMockUser(roles = "USER")
    void getAvailableJobs_onlyPublished() throws Exception {
        var prof = userRepository.findById(professorId).get();
        var rg   = prof.getResearchGroup();
        // given: one published job
        Job published = new Job();
        published.setSupervisingProfessor(userRepository.findById(professorId).get());
        published.setTitle("Published Role");
        published.setFieldOfStudies("CS");
        published.setResearchArea("ML");
        published.setLocation(Campus.GARCHING);
        published.setWorkload(20);
        published.setStartDate(LocalDate.of(2025,  9, 1));
        published.setState(JobState.PUBLISHED);
        published.setResearchGroup(rg);
        jobRepository.save(published);

        // ...and one draft job
        Job draft = new Job();
        draft.setSupervisingProfessor(userRepository.findById(professorId).get());
        draft.setTitle("Draft Role");
        draft.setFieldOfStudies("CS");
        draft.setResearchArea("ML");
        draft.setLocation(Campus.GARCHING);
        draft.setWorkload(20);
        draft.setStartDate(LocalDate.of(2025, 10, 1));
        draft.setState(JobState.DRAFT);
        draft.setResearchGroup(rg);
        jobRepository.save(draft);

        // when / then: only the published one comes back
        mockMvc.perform(get("/api/jobs/available")
                .param("pageNumber", "0")
                .param("pageSize", "10")
                .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].title").value("Published Role"));
    }

    @Test
    @DisplayName("POST /api/jobs/create → persists and returns a JobFormDTO")
    @WithMockUser(roles = "INSTRUCTOR")
    void createJob_persistsAndReturnsIt() throws Exception {
        // prepare payload
        JobFormDTO payload = new JobFormDTO(
            null,                      // no ID yet
            String.valueOf(professorId),
            "ML Engineer",
            "Machine Learning",
            professorId,
            Campus.GARCHING,
            LocalDate.of(2025, 11, 1),
            LocalDate.of(2026,  5, 31),
            40,
            12,
            FundingType.FULLY_FUNDED,
            "Build ML pipelines",
            "data cleaning and model training",
            "Python and TensorFlow",
            JobState.PUBLISHED
        );

        // when: call the POST endpoint
        var mvcResult = mockMvc.perform(post("/api/jobs/create")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.jobId").exists())
            .andExpect(jsonPath("$.title").value("ML Engineer"))
            .andReturn();

        // then: the returned ID really exists in the DB
        String responseJson = mvcResult.getResponse().getContentAsString();
        JobFormDTO returned = objectMapper.readValue(responseJson, JobFormDTO.class);

        assertThat(jobRepository.findById(returned.jobId()))
            .isPresent()
            .get()
            .extracting(Job::getTitle, Job::getState)
            .containsExactly("ML Engineer", JobState.PUBLISHED);
    }
}
