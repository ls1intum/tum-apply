package de.tum.cit.aet.application.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ApplicantSubjectAreaSubscriptionResourceTest extends AbstractResourceTest {

    @Autowired
    ApplicantRepository applicantRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    Applicant applicant;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
    }

    @Nested
    class GetSubscriptions {

        @Test
        void getSubscriptionsReturnsEmptyListForNewApplicant() {
            List<SubjectArea> subscriptions = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(subscriptions).isEmpty();
        }

        @Test
        void getSubscriptionsReturnsExistingSubscriptions() {
            // Create some subscriptions
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE", null, Void.class, 204);
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applicants/subject-area-subscriptions/MATHEMATICS", null, Void.class, 204);

            // Verify we can retrieve them
            List<SubjectArea> subscriptions = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(subscriptions).hasSize(2).containsExactly(SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS);
        }
    }

    @Nested
    class PostSubscription {

        @Test
        void postSubscriptionCreatesNewSubscription() {
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE", null, Void.class, 204);

            // Verify in database
            List<SubjectArea> all = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(all).hasSize(1).contains(SubjectArea.COMPUTER_SCIENCE);
        }

        @Test
        void postSubscriptionTwiceDoesNotCreateDuplicates() {
            // Add subscription twice
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE", null, Void.class, 204);
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE", null, Void.class, 204);

            // Verify only one subscription exists
            List<SubjectArea> subscriptions = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(subscriptions).hasSize(1);
        }
    }

    @Nested
    class DeleteSubscription {

        @Test
        void deleteSubscriptionRemovesOnlyTheSelectedOne() {
            UUID userId = applicant.getUserId();

            // User checks Computer Science
            api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .postAndRead("/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE", null, Void.class, 204);

            // User checks Mathematics
            api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .postAndRead("/api/applicants/subject-area-subscriptions/MATHEMATICS", null, Void.class, 204);

            // Verify both exist
            List<SubjectArea> after = api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);
            assertThat(after).hasSize(2);

            // User unchecks Computer Science
            api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .deleteAndRead("/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE", null, Void.class, 204);

            // Verify only Mathematics remains
            List<SubjectArea> finalResult = api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(finalResult).hasSize(1).contains(SubjectArea.MATHEMATICS);
        }
    }
}
