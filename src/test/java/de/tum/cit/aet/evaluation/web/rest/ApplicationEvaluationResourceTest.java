package de.tum.cit.aet.evaluation.web.rest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.dto.OffsetPageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.evaluation.dto.*;
import de.tum.cit.aet.evaluation.repository.ApplicationEvaluationRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ApplicationEvaluationResourceTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    UserRepository userRepository;
    @Autowired
    ResearchGroupRepository researchGroupRepository;
    @Autowired
    ApplicantRepository applicantRepository;
    @Autowired
    JobRepository jobRepository;
    @Autowired
    ApplicationRepository applicationRepository;
    @Autowired
    ApplicationEvaluationRepository evaluationRepository;
    @Autowired
    ApplicationReviewRepository applicationReviewRepository;

    @MockitoBean
    CurrentUserService currentUserService;

    @MockitoBean
    AsyncEmailSender sender;

    MvcTestClient api;

    User professor;
    ResearchGroup researchGroup;
    User applicantUser;
    Applicant applicant;
    Job publishedJob;
    Application sentApp;
    Application inReviewApp;

    @BeforeEach
    void setup() {
        api = new MvcTestClient(mockMvc, objectMapper);

        applicationReviewRepository.deleteAllInBatch();
        evaluationRepository.deleteAllInBatch();
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

        publishedJob = JobTestData.saved(
            jobRepository, professor, researchGroup,
            "Published Role", JobState.PUBLISHED, LocalDate.now().plusDays(7)
        );

        sentApp = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        inReviewApp = ApplicationTestData.savedInReview(applicationRepository, publishedJob, applicant);

        when(currentUserService.getUser()).thenReturn(professor);
        when(currentUserService.getResearchGroupIdIfProfessor()).thenReturn(researchGroup.getResearchGroupId());

        doNothing().when(sender).sendAsync(any());
    }


    @Test
    @WithMockUser
    void getApplicationsOverviews_onlyViewableStates() {
        var dto = api.getAndReadOk(
            "/api/evaluation/applications",
            Map.ofEntries(entry("offset", "0"), entry("limit", "10")),
            new TypeReference<ApplicationEvaluationOverviewListDTO>() {
            }
        );

        assertThat(dto.totalRecords()).isGreaterThanOrEqualTo(2);
        assertThat(dto.applications()).extracting("applicationId")
            .contains(sentApp.getApplicationId(), inReviewApp.getApplicationId());
    }


    @Test
    @WithMockUser
    void getApplicationsDetails_returnsDetails() {
        var details = api.getAndReadOk(
            "/api/evaluation/application-details",
            Map.of("offset", "0", "limit", "10"),
            new TypeReference<ApplicationEvaluationDetailListDTO>() {
            }
        );

        assertThat(details.totalRecords()).isGreaterThanOrEqualTo(2);
        assertThat(details.applications()).isNotEmpty();
    }


    @Test
    @WithMockUser
    void getApplicationsDetailsWindow_validOddSize_containsTarget() {
        var win = api.getAndReadOk(
            "/api/evaluation/application-details/window",
            Map.ofEntries(
                entry("applicationId", inReviewApp.getApplicationId().toString()),
                entry("windowSize", "3")
            ),
            new TypeReference<ApplicationEvaluationDetailListDTO>() {
            }
        );

        assertThat(win.applications().size()).isBetween(1, 3);
    }

    @Test
    @WithMockUser
    void getApplicationsDetails_limitIsApplied() {
        var details = api.getAndReadOk(
            "/api/evaluation/application-details",
            Map.of("offset","0","limit","1"),
            new TypeReference<ApplicationEvaluationDetailListDTO>() {}
        );
        assertThat(details.totalRecords()).isGreaterThanOrEqualTo(2);
        assertThat(details.applications()).hasSize(1);
    }

    @Test
    @WithMockUser
    void getApplicationsDetailsWindow_evenSize_isClientError() throws Exception {
        mockMvc.perform(
                get("/api/evaluation/application-details/window")
                    .param("applicationId", sentApp.getApplicationId().toString())
                    .param("windowSize", "2")
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }


    @Test
    @WithMockUser
    void getJobFilterOptions_ok_evenIfEmpty() {
        Set<JobFilterOptionDTO> options = api.getAndReadOk(
            "/api/evaluation/jobs",
            Map.of(),
            new TypeReference<>() {
            }
        );

        assertThat(options).isNotNull();
    }


    @Test
    @WithMockUser
    void markApplicationAsInReview_sent_becomesInReview() throws Exception {
        mockMvc.perform(
                put("/api/evaluation/applications/{applicationId}/open", sentApp.getApplicationId())
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isNoContent());

        var updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.IN_REVIEW);
    }


    @Test
    @WithMockUser
    void acceptApplication_sent_becomesAccepted_andMayCloseJob() throws Exception {
        String message = "Accepted!";
        var payload = new AcceptDTO(message, true, true);

        mockMvc.perform(
                post("/api/evaluation/applications/{applicationId}/accept", sentApp.getApplicationId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsBytes(payload))
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isNoContent());

        var updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.ACCEPTED);
        assertThat(updated.getApplicationReview()).isNotNull();
        assertThat(updated.getApplicationReview().getReason()).isEqualTo(message);

        var job = jobRepository.findById(publishedJob.getJobId()).orElseThrow();
        assertThat(job.getState()).isEqualTo(JobState.APPLICANT_FOUND);
    }

    @Test
    @WithMockUser
    void rejectApplication_inReview_becomesRejected_andStoresReason() throws Exception {
        var payload = new RejectDTO(RejectReason.OTHER_REASON, true);

        mockMvc.perform(
                post("/api/evaluation/applications/{applicationId}/reject", inReviewApp.getApplicationId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsBytes(payload))
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isNoContent());

        var updated = applicationRepository.findById(inReviewApp.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.REJECTED);
        assertThat(updated.getApplicationReview()).isNotNull();
        assertThat(updated.getApplicationReview().getReason()).isNotBlank();
    }

    @Test
    void acceptApplication_unauthenticated_returns401() throws Exception {
        var payload = new AcceptDTO("msg", false, false);

        mockMvc.perform(
                post("/api/evaluation/applications/{applicationId}/accept", sentApp.getApplicationId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsBytes(payload))
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectApplication_unauthenticated_returns401() throws Exception {
        var payload = new RejectDTO(RejectReason.FAILED_REQUIREMENTS, false);

        mockMvc.perform(
                post("/api/evaluation/applications/{applicationId}/reject", sentApp.getApplicationId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsBytes(payload))
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isUnauthorized());
    }

    @Test
    void markApplicationAsInReview_unauthenticated_returns401() throws Exception {
        mockMvc.perform(
                put("/api/evaluation/applications/{applicationId}/open", sentApp.getApplicationId())
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(status().isUnauthorized());
    }


    @Test
    @WithMockUser
    void getApplicationsOverviews_withSorting_params_ok() {
        var sort = new SortDTO("createdAt", SortDTO.Direction.DESC);
        var page = new OffsetPageDTO(0, 10);

        var dto = api.getAndReadOk(
            "/api/evaluation/applications",
            Map.of(
                "offset", String.valueOf(page.offset()),
                "limit", String.valueOf(page.limit()),
                "sortBy", sort.sortBy(),
                "direction", sort.direction().name()
            ),
            new TypeReference<ApplicationEvaluationOverviewListDTO>() {
            }
        );

        assertThat(dto.totalRecords()).isGreaterThan(0);
        assertThat(dto.applications()).isNotEmpty();
    }
}
