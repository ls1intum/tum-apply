package de.tum.cit.aet.evaluation.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.evaluation.domain.Rating;
import de.tum.cit.aet.evaluation.dto.RatingOverviewDTO;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.*;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RatingResourceTest extends AbstractResourceTest {

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
    RatingRepository ratingRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    User professor;
    User otherProfessor;
    ResearchGroup researchGroup;
    Applicant applicant;
    Job publishedJob;
    Application application;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, researchGroup);
        otherProfessor = UserTestData.savedProfessor(userRepository, researchGroup);

        applicant = ApplicantTestData.savedWithNewUser(applicantRepository);

        publishedJob = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Role X",
            JobState.PUBLISHED,
            LocalDate.now().plusDays(14)
        );

        application = ApplicationTestData.savedInReview(applicationRepository, publishedJob, applicant);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getRatingsReturnsEmptyOverview() {
        String url = "/api/applications/" + application.getApplicationId() + "/ratings";

        RatingOverviewDTO overview = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(url, Map.of(), RatingOverviewDTO.class, 200);

        assertThat(overview.currentUserRating()).isNull();
        assertThat(overview.otherRatings()).isEmpty();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getRatingsNonexistentApplicationReturns404() {
        UUID fakeAppId = UUID.randomUUID();
        String url = "/api/applications/" + fakeAppId + "/ratings";

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR")).getAndRead(url, Map.of(), Void.class, 404);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateRatingCreateAndUpdateAndDelete() {
        String url = "/api/applications/" + application.getApplicationId() + "/ratings";

        RatingOverviewDTO created = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(url + "?rating=1", null, RatingOverviewDTO.class, 200);

        assertThat(created.currentUserRating()).isEqualTo(1);

        RatingOverviewDTO updated = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(url + "?rating=2", null, RatingOverviewDTO.class, 200);

        assertThat(updated.currentUserRating()).isEqualTo(2);

        RatingOverviewDTO deleted = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .putAndRead(url, null, RatingOverviewDTO.class, 200);

        assertThat(deleted.currentUserRating()).isNull();
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void updateRatingNonexistentApplicationReturns404() {
        UUID fakeAppId = UUID.randomUUID();
        String url = "/api/applications/" + fakeAppId + "/ratings";

        api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR")).putAndRead(url + "?rating=1", null, Void.class, 404);
    }

    @Test
    void getRatingsUnauthenticatedReturns401() {
        String url = "/api/applications/" + application.getApplicationId() + "/ratings";
        api.withoutPostProcessors().getAndRead(url, Map.of(), Void.class, 401);
    }

    @Test
    void updateRatingUnauthenticatedReturns401() {
        String url = "/api/applications/" + application.getApplicationId() + "/ratings";
        api.withoutPostProcessors().putAndRead(url + "?rating=1", null, Void.class, 401);
    }

    @Test
    @WithMockUser
    void allEndpoints_withoutProfessorRole_return403() {
        String url = "/api/applications/" + application.getApplicationId() + "/ratings";

        api.getAndRead(url, Map.of(), Void.class, 403);

        api.putAndRead(url + "?rating=1", null, Void.class, 403);
    }

    @Test
    @WithMockUser(roles = "PROFESSOR")
    void getRatingsIncludesOtherProfessorRatings() {
        Rating otherRating = RatingTestData.saved(ratingRepository, application, otherProfessor, -1);

        String url = "/api/applications/" + application.getApplicationId() + "/ratings";

        RatingOverviewDTO overview = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(url, Map.of(), RatingOverviewDTO.class, 200);

        assertThat(overview.currentUserRating()).isNull();
        assertThat(overview.otherRatings()).anyMatch(
            r -> r.rating() == -1 && r.from().equals(otherProfessor.getFirstName() + " " + otherProfessor.getLastName())
        );
    }
}
