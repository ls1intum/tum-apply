package de.tum.cit.aet.application.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.dto.ApplicantSubjectAreaSubscriptionDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ApplicantSubjectAreaSubscriptionRepository;
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
    ApplicantSubjectAreaSubscriptionRepository subscriptionRepository;

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
            List<ApplicantSubjectAreaSubscriptionDTO> subscriptions = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(subscriptions).isEmpty();
        }

        @Test
        void getSubscriptionsReturnsExistingSubscriptions() {
            // Create some subscriptions
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead(
                    "/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE",
                    null,
                    ApplicantSubjectAreaSubscriptionDTO.class,
                    200
                );
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead(
                    "/api/applicants/subject-area-subscriptions/MATHEMATICS",
                    null,
                    ApplicantSubjectAreaSubscriptionDTO.class,
                    200
                );

            // Verify we can retrieve them
            List<ApplicantSubjectAreaSubscriptionDTO> subscriptions = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(subscriptions)
                .hasSize(2)
                .extracting(ApplicantSubjectAreaSubscriptionDTO::subjectArea)
                .containsExactly(SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS);
        }
    }

    @Nested
    class PostSubscription {

        @Test
        void postSubscriptionCreatesNewSubscription() {
            ApplicantSubjectAreaSubscriptionDTO result = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead(
                    "/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE",
                    null,
                    ApplicantSubjectAreaSubscriptionDTO.class,
                    200
                );

            assertThat(result.subjectArea()).isEqualTo(SubjectArea.COMPUTER_SCIENCE);

            // Verify in database
            List<ApplicantSubjectAreaSubscriptionDTO> all = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(all).hasSize(1).extracting(ApplicantSubjectAreaSubscriptionDTO::subjectArea).contains(SubjectArea.COMPUTER_SCIENCE);
        }

        @Test
        void postSubscriptionTwiceDontCreateDuplicates() {
            // Add subscription twice
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead(
                    "/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE",
                    null,
                    ApplicantSubjectAreaSubscriptionDTO.class,
                    200
                );
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead(
                    "/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE",
                    null,
                    ApplicantSubjectAreaSubscriptionDTO.class,
                    200
                );

            // Verify only one subscription exists
            List<ApplicantSubjectAreaSubscriptionDTO> subscriptions = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(subscriptions).hasSize(1);
        }
    }

    @Nested
    class DeleteSubscription {

        @Test
        void deleteSubscriptionRemovesIt() {
            // Create subscription
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead(
                    "/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE",
                    null,
                    ApplicantSubjectAreaSubscriptionDTO.class,
                    200
                );

            // Verify it exists
            List<ApplicantSubjectAreaSubscriptionDTO> before = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);
            assertThat(before).hasSize(1);

            // Delete it
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE", null, Void.class, 204);

            // Verify it's gone
            List<ApplicantSubjectAreaSubscriptionDTO> after = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(after).isEmpty();
        }
    }

    @Nested
    class CheckboxPattern {

        @Test
        void applicantCanToggleMultipleSubscriptions() {
            UUID userId = applicant.getUserId();

            // User checks Computer Science
            api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .postAndRead(
                    "/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE",
                    null,
                    ApplicantSubjectAreaSubscriptionDTO.class,
                    200
                );

            // User checks Mathematics
            api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .postAndRead(
                    "/api/applicants/subject-area-subscriptions/MATHEMATICS",
                    null,
                    ApplicantSubjectAreaSubscriptionDTO.class,
                    200
                );

            // Verify both exist
            List<ApplicantSubjectAreaSubscriptionDTO> after = api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);
            assertThat(after).hasSize(2);

            // User unchecks Computer Science
            api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .deleteAndRead("/api/applicants/subject-area-subscriptions/COMPUTER_SCIENCE", null, Void.class, 204);

            // Verify only Mathematics remains
            List<ApplicantSubjectAreaSubscriptionDTO> final_result = api
                .with(JwtPostProcessors.jwtUser(userId, "ROLE_APPLICANT"))
                .getAndRead("/api/applicants/subject-area-subscriptions", null, new TypeReference<>() {}, 200);

            assertThat(final_result)
                .hasSize(1)
                .extracting(ApplicantSubjectAreaSubscriptionDTO::subjectArea)
                .contains(SubjectArea.MATHEMATICS);
        }
    }
}
