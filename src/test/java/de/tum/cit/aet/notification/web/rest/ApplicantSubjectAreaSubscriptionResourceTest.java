package de.tum.cit.aet.notification.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.notification.domain.ApplicantSubjectAreaSubscription;
import de.tum.cit.aet.notification.dto.ApplicantSubjectAreaSubscriptionDTO;
import de.tum.cit.aet.notification.repository.ApplicantSubjectAreaSubscriptionRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ApplicantSubjectAreaSubscriptionResourceTest extends AbstractResourceTest {

    private static final String BASE_URL = "/api/settings/subject-area-subscriptions";

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    ApplicantRepository applicantRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    ApplicantSubjectAreaSubscriptionRepository applicantSubjectAreaSubscriptionRepository;

    @Autowired
    MvcTestClient api;

    Applicant applicant;
    User professor;
    ResearchGroup researchGroup;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, researchGroup);
    }

    private MvcTestClient asApplicant() {
        return api.with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"));
    }

    private MvcTestClient asProfessor() {
        return api.with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"));
    }

    @Nested
    class GetSubscriptions {

        @Test
        void getCurrentApplicantSubscriptionsReturnsSavedSubjectAreas() {
            saveSubscription(applicant, SubjectArea.MATHEMATICS);
            saveSubscription(applicant, SubjectArea.COMPUTER_SCIENCE);

            ApplicantSubjectAreaSubscriptionDTO result = asApplicant().getAndRead(BASE_URL, null, ApplicantSubjectAreaSubscriptionDTO.class, 200);

            assertThat(result.subjectAreas()).containsExactly(SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS);
        }

        @Test
        void getCurrentApplicantSubscriptionsReturnsEmptyListWhenNoneExist() {
            ApplicantSubjectAreaSubscriptionDTO result = asApplicant().getAndRead(BASE_URL, null, ApplicantSubjectAreaSubscriptionDTO.class, 200);

            assertThat(result.subjectAreas()).isEmpty();
        }
    }

    @Nested
    class UpdateSubscriptions {

        @Test
        void updateCurrentApplicantSubscriptionsPersistsNormalizedSelection() {
            ApplicantSubjectAreaSubscriptionDTO payload = new ApplicantSubjectAreaSubscriptionDTO(
                List.of(SubjectArea.MATHEMATICS, SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS)
            );

            ApplicantSubjectAreaSubscriptionDTO result = asApplicant().putAndRead(BASE_URL, payload, ApplicantSubjectAreaSubscriptionDTO.class, 200);

            assertThat(result.subjectAreas()).containsExactly(SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS);

            List<ApplicantSubjectAreaSubscription> persisted = applicantSubjectAreaSubscriptionRepository.findAllByApplicantOrderBySubjectAreaAsc(applicant);
            assertThat(persisted).hasSize(2);
            assertThat(persisted).extracting(ApplicantSubjectAreaSubscription::getSubjectArea)
                .containsExactly(SubjectArea.COMPUTER_SCIENCE, SubjectArea.MATHEMATICS);
        }

        @Test
        void updateCurrentApplicantSubscriptionsReplacesExistingSelection() {
            saveSubscription(applicant, SubjectArea.MATHEMATICS);
            saveSubscription(applicant, SubjectArea.PHYSICS);

            ApplicantSubjectAreaSubscriptionDTO payload = new ApplicantSubjectAreaSubscriptionDTO(List.of(SubjectArea.COMPUTER_SCIENCE));

            ApplicantSubjectAreaSubscriptionDTO result = asApplicant().putAndRead(BASE_URL, payload, ApplicantSubjectAreaSubscriptionDTO.class, 200);

            assertThat(result.subjectAreas()).containsExactly(SubjectArea.COMPUTER_SCIENCE);
            assertThat(applicantSubjectAreaSubscriptionRepository.findAllByApplicantOrderBySubjectAreaAsc(applicant))
                .extracting(ApplicantSubjectAreaSubscription::getSubjectArea)
                .containsExactly(SubjectArea.COMPUTER_SCIENCE);
        }

        @Test
        void updateCurrentApplicantSubscriptionsRejectsNullEntries() {
            ApplicantSubjectAreaSubscriptionDTO payload = new ApplicantSubjectAreaSubscriptionDTO(
                Arrays.asList(SubjectArea.COMPUTER_SCIENCE, null)
            );

            asApplicant().putAndRead(BASE_URL, payload, Void.class, 400);
        }
    }

    @Nested
    class Authorization {

        @Test
        void unauthenticatedReturns403() {
            api.getAndRead(BASE_URL, null, Void.class, 403);
            api.putAndRead(BASE_URL, new ApplicantSubjectAreaSubscriptionDTO(List.of()), Void.class, 403);
        }

        @Test
        void nonApplicantsCannotAccessEndpoint() {
            asProfessor().getAndRead(BASE_URL, null, Void.class, 403);
            asProfessor().putAndRead(BASE_URL, new ApplicantSubjectAreaSubscriptionDTO(List.of(SubjectArea.COMPUTER_SCIENCE)), Void.class, 403);
        }
    }

    private void saveSubscription(Applicant applicant, SubjectArea subjectArea) {
        ApplicantSubjectAreaSubscription subscription = new ApplicantSubjectAreaSubscription();
        subscription.setApplicant(applicant);
        subscription.setSubjectArea(subjectArea);
        applicantSubjectAreaSubscriptionRepository.save(subscription);
    }
}
