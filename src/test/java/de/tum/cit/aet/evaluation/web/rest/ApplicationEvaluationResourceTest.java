package de.tum.cit.aet.evaluation.web.rest;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.dto.OffsetPageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.evaluation.dto.AcceptDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationDetailListDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewListDTO;
import de.tum.cit.aet.evaluation.dto.RejectDTO;
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
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testDataGeneration.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.LocalDate;
import java.util.Map;

import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ApplicationEvaluationResourceTest {

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
    @Autowired
    UserResearchGroupRoleRepository userResearchGroupRoleRepository;

    @MockitoBean
    AsyncEmailSender sender;

    @Autowired
    MvcTestClient api;

    User professor;
    ResearchGroup researchGroup;
    Applicant applicant;
    Job publishedJob;
    Application sentApp;
    Application inReviewApp;

    @BeforeEach
    void setup() {
        applicationReviewRepository.deleteAllInBatch();
        evaluationRepository.deleteAllInBatch();
        applicationRepository.deleteAllInBatch();
        jobRepository.deleteAllInBatch();
        userResearchGroupRoleRepository.deleteAllInBatch();
        applicantRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        researchGroupRepository.deleteAllInBatch();

        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, researchGroup);

        applicant = ApplicantTestData.savedWithNewUser(applicantRepository);

        publishedJob = JobTestData.saved(
            jobRepository, professor, researchGroup,
            "Published Role", JobState.PUBLISHED, LocalDate.now().plusDays(7)
        );

        sentApp = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        inReviewApp = ApplicationTestData.savedInReview(applicationRepository, publishedJob, applicant);

        doNothing().when(sender).sendAsync(any());
    }


    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getApplicationsOverviews_onlyViewableStates() {
        ApplicationEvaluationOverviewListDTO dto = api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                "/api/evaluation/applications",
                Map.ofEntries(entry("offset", "0"), entry("limit", "10")),
                ApplicationEvaluationOverviewListDTO.class,
                200
            );


        assertThat(dto.totalRecords()).isGreaterThanOrEqualTo(2);
        assertThat(dto.applications()).extracting("applicationId")
            .contains(sentApp.getApplicationId(), inReviewApp.getApplicationId());
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getApplicationsDetails_returnsDetails() {
        ApplicationEvaluationDetailListDTO details = api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                "/api/evaluation/application-details",
                Map.of("offset", "0", "limit", "10"),
                ApplicationEvaluationDetailListDTO.class,
                200
            );

        assertThat(details.totalRecords()).isGreaterThanOrEqualTo(2);
        assertThat(details.applications()).isNotEmpty();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getApplicationsDetailsWindow_validOddSize() {
        ApplicationEvaluationDetailListDTO win = api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                "/api/evaluation/application-details/window",
                Map.ofEntries(entry("applicationId", inReviewApp.getApplicationId().toString()), entry("windowSize", "3")),
                ApplicationEvaluationDetailListDTO.class,
                200
            );
        assertThat(win.applications().size()).isBetween(1, 3);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getApplicationsDetails_limitIsApplied() {
        ApplicationEvaluationDetailListDTO details = api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                "/api/evaluation/application-details",
                Map.of("offset", "0", "limit", "1"),
                ApplicationEvaluationDetailListDTO.class,
                200
            );
        assertThat(details.totalRecords()).isGreaterThanOrEqualTo(2);
        assertThat(details.applications()).hasSize(1);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void markApplicationAsInReview_sent_becomesInReview() {
        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/open", null, Void.class, 204);

        Application updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.IN_REVIEW);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void acceptApplication_sent_becomesAccepted_andMayCloseJob() {
        String message = "Accepted!";
        AcceptDTO payload = new AcceptDTO(message, true, true);

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/accept", payload, Void.class, 204);

        Application updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.ACCEPTED);
        assertThat(updated.getApplicationReview()).isNotNull();
        assertThat(updated.getApplicationReview().getReason()).isEqualTo(message);

        Job job = jobRepository.findById(publishedJob.getJobId()).orElseThrow();
        assertThat(job.getState()).isEqualTo(JobState.APPLICANT_FOUND);
        verify(sender, times(2)).sendAsync(any());
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void rejectApplication_inReview_becomesRejected_andStoresReason() {
        RejectDTO payload = new RejectDTO(RejectReason.OTHER_REASON, true);

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead("/api/evaluation/applications/" + inReviewApp.getApplicationId() + "/reject", payload, Void.class, 204);

        Application updated = applicationRepository.findById(inReviewApp.getApplicationId()).orElseThrow();
        assertThat(updated.getState()).isEqualTo(ApplicationState.REJECTED);
        assertThat(updated.getApplicationReview()).isNotNull();
        assertThat(updated.getApplicationReview().getReason()).isNotBlank();
        verify(sender, times(1)).sendAsync(any());
    }

    @Test
    void acceptApplication_unauthenticated_returns401() {
        AcceptDTO payload = new AcceptDTO("msg", false, false);
        api.withoutPostProcessors().postAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/accept", payload, Void.class, 401);
    }

    @Test
    void rejectApplication_unauthenticated_returns401() {
        RejectDTO payload = new RejectDTO(RejectReason.FAILED_REQUIREMENTS, false);
        api.withoutPostProcessors().postAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/reject", payload, Void.class, 401);
    }

    @Test
    void markApplicationAsInReview_unauthenticated_returns401() {
        api.withoutPostProcessors().putAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/open", null, Void.class, 401);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getApplicationsOverviews_withSorting_params_ok() {
        SortDTO sort = new SortDTO("appliedAt", SortDTO.Direction.DESC);
        OffsetPageDTO page = new OffsetPageDTO(0, 10);

        ApplicationEvaluationOverviewListDTO dto = api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(
                "/api/evaluation/applications",
                Map.of(
                    "offset", String.valueOf(page.offset()),
                    "limit", String.valueOf(page.limit()),
                    "sortBy", sort.sortBy(),
                    "direction", sort.direction().name()
                ),
                ApplicationEvaluationOverviewListDTO.class,
                200
            );

        assertThat(dto.totalRecords()).isGreaterThan(0);
        assertThat(dto.applications()).isNotEmpty();
    }
}
