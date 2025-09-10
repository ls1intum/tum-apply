package de.tum.cit.aet.application.web.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.dto.*;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.*;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.service.CurrentUserService;
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
import de.tum.cit.aet.utility.testDataGeneration.TestDataFactory;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class ApplicationResourceTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    // Repositories
    @Autowired
    UserRepository userRepository;
    @Autowired
    ApplicantRepository applicantRepository;
    @Autowired
    JobRepository jobRepository;
    @Autowired
    ApplicationRepository applicationRepository;
    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @MockitoBean
    CurrentUserService currentUserService;

    MvcTestClient api;

    User professor;
    ResearchGroup researchGroup;
    User applicantUser;
    Applicant applicant;
    Job publishedJob1;
    Job publishedJob2;
    Application sentApp;
    Application inReviewApp;

    @BeforeEach
    void setup() {
        api = new MvcTestClient(mockMvc, objectMapper);

        applicationRepository.deleteAllInBatch();
        jobRepository.deleteAllInBatch();
        applicantRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        researchGroupRepository.deleteAllInBatch();

        researchGroup = new ResearchGroup();
        researchGroup.setName("CIT Robotics");
        researchGroup.setHead("Head Professor");
        researchGroup = researchGroupRepository.save(researchGroup);

        professor = new User();
        professor.setUserId(UUID.randomUUID());
        professor.setEmail("prof@example.com");
        professor.setSelectedLanguage(Language.GERMAN.getCode());
        professor.setFirstName("Prof");
        professor.setLastName("McGonagall");
        professor.setResearchGroup(researchGroup);
        professor = userRepository.save(professor);

        applicantUser = new User();
        applicantUser.setUserId(UUID.randomUUID());
        applicantUser.setEmail("ada@example.com");
        applicantUser.setSelectedLanguage(Language.ENGLISH.getCode());
        applicantUser.setFirstName("Ada");
        applicantUser.setLastName("Lovelace");

        applicant = ApplicantTestData.saved(applicantRepository, applicantUser);

        publishedJob1 = JobTestData.saved(
                jobRepository, professor, researchGroup,
                "Published Role", JobState.PUBLISHED, LocalDate.now().plusDays(7));

        publishedJob2 = JobTestData.saved(
                jobRepository, professor, researchGroup,
                "Published Role 2", JobState.PUBLISHED, LocalDate.now().plusDays(14));

        sentApp = ApplicationTestData.savedSent(applicationRepository, publishedJob1, applicant);
        inReviewApp = ApplicationTestData.savedInReview(applicationRepository, publishedJob1, applicant);

        when(currentUserService.getUser()).thenReturn(applicant.getUser());
        when(currentUserService.getUserId()).thenReturn(applicant.getUserId());
        when(currentUserService.getResearchGroupIdIfProfessor()).thenReturn(researchGroup.getResearchGroupId());
    }

    @Test
    @WithMockUser
    void createApplication_persists_andReturnsDto() throws Exception {
        mockMvc.perform(post("/api/applications/create/{jobId}", publishedJob2.getJobId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.job.jobId").value(publishedJob2.getJobId().toString()));

        List<Application> apps = applicationRepository.findAll();
        assertThat(apps).anyMatch(a -> a.getJob().getJobId().equals(publishedJob2.getJobId()));
    }

    @Test
    @WithMockUser
    void updateApplication_changesState_andReturnsDto() throws Exception {
        UpdateApplicationDTO req = TestDataFactory.createUpdateApplicationDTO(sentApp.getApplicationId(),
                applicant.getUserId(), publishedJob1.getJobId());
        req = new UpdateApplicationDTO(
                req.applicationId(),
                req.applicant(),
                req.desiredDate(),
                ApplicationState.SENT,
                req.projects(),
                req.specialSkills(),
                req.motivation());

        mockMvc.perform(put("/api/applications")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsBytes(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationState").value("SENT"));

        Application updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.SENT);
    }

    @Test
    @WithMockUser
    void getApplicationById_returnsStoredApplication() throws Exception {
        mockMvc.perform(get("/api/applications/{applicationId}", sentApp.getApplicationId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicationId").value(sentApp.getApplicationId().toString()))
                .andExpect(jsonPath("$.job.title").value("Published Role"));
    }

    @Test
    @WithMockUser
    void deleteApplication_removesEntry() throws Exception {
        mockMvc.perform(delete("/api/applications/{applicationId}", sentApp.getApplicationId()))
                .andExpect(status().isNoContent());

        assertThat(applicationRepository.existsById(sentApp.getApplicationId())).isFalse();
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void deleteDocumentFromApplication_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/applications/delete-document/{id}", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void deleteDocumentBatchByType_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/applications/batch-delete-document/{applicationId}/{type}",
                sentApp.getApplicationId(), DocumentType.CV))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void renameDocument_returnsOk() throws Exception {
        mockMvc.perform(put("/api/applications/rename-document/{id}", UUID.randomUUID())
                .param("newName", "RenamedDoc"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void getAllApplicationsOfApplicant_returnsList() throws Exception {
        mockMvc.perform(get("/api/applications/applicant/{id}", applicant.getUserId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].applicationId").value(sentApp.getApplicationId().toString()));
    }

    @Test
    @WithMockUser
    void getAllApplicationsOfJob_returnsList() throws Exception {
        mockMvc.perform(get("/api/applications/job/{id}", publishedJob1.getJobId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].job.jobId").value(publishedJob1.getJobId().toString()));
    }

    @Test
    @WithMockUser
    void withdrawApplication_changesState_andSendsOk() throws Exception {
        mockMvc.perform(put("/api/applications/withdraw/{applicationId}", sentApp.getApplicationId()))
                .andExpect(status().isOk());

        Application updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.WITHDRAWN);
    }

    @Test
    @WithMockUser
    void getApplicationPages_returnsOverviewList() throws Exception {
        mockMvc.perform(get("/api/applications/pages")
                .param("pageSize", "25")
                .param("pageNumber", "0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].applicationId").value(sentApp.getApplicationId().toString()));
    }

    @Test
    @WithMockUser
    void getApplicationPagesLength_returnsCorrectCount() throws Exception {
        mockMvc.perform(get("/api/applications/pages/length/{applicantId}", applicant.getUserId()))
                .andExpect(status().isOk())
                .andExpect(content().string("2"));
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationForDetailPage_returnsDetailDto() throws Exception {
        mockMvc.perform(get("/api/applications/{applicationId}/detail", sentApp.getApplicationId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobTitle").exists());
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void uploadDocuments_forCv_returnsOk() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "cv.pdf", MediaType.APPLICATION_PDF_VALUE, "content".getBytes());

        mockMvc.perform(multipart("/api/applications/upload-documents/{applicationId}/{documentType}",
                sentApp.getApplicationId(), DocumentType.CV)
                .file(file))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void getDocumentDictionaryIds_returnsDto() throws Exception {
        mockMvc.perform(get("/api/applications/getDocumentIds/{applicationId}", sentApp.getApplicationId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cvDocumentDictionaryId").doesNotExist());
    }
}
