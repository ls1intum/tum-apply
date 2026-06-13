package de.tum.cit.aet.reference;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import de.tum.cit.aet.reference.dto.ReferenceLetterUploadContextDTO;
import de.tum.cit.aet.reference.dto.ReferenceRequestDTO;
import de.tum.cit.aet.reference.repository.ReferenceRequestRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.ApplicationTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ReferenceRequestTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.core.type.TypeReference;

class ReferenceLetterUploadResourceTest extends AbstractResourceTest {

    private static final String CONTEXT_URL = "/api/reference-letters/%s";
    private static final String DECLINE_URL = "/api/reference-letters/%s/decline";

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    JobRepository jobRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ApplicantRepository applicantRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    ReferenceRequestRepository referenceRequestRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    private ResearchGroup researchGroup;
    private User professor;
    private Applicant applicant;
    private Job jobWithReferences;
    private Application application;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        api.withoutPostProcessors();
        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, researchGroup);
        applicant = ApplicantTestData.savedWithNewUser(applicantRepository, userRepository);
        jobWithReferences = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Reference Letter Test Position",
            JobState.PUBLISHED,
            LocalDate.of(2026, 9, 1)
        );
        jobWithReferences.setReferenceLettersRequired(1);
        jobWithReferences = jobRepository.save(jobWithReferences);

        application = ApplicationTestData.saved(applicationRepository, jobWithReferences, applicant, ApplicationState.PENDING);
    }

    private ReferenceRequest savedRequestedEntry(String rawToken) {
        ReferenceRequest entry = ReferenceRequestTestData.newReferenceRequest(application, "ada@example.com");
        entry.setTokenHash(hashToken(rawToken));
        entry.setTokenExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusDays(14));
        entry.setStatus(ReferenceRequestStatus.REQUESTED);
        return referenceRequestRepository.save(entry);
    }

    private static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is required", e);
        }
    }

    private static MockMultipartFile pdf(String filename) {
        return new MockMultipartFile("file", filename, "application/pdf", "%PDF-1.4 test".getBytes(StandardCharsets.UTF_8));
    }

    @Nested
    class GetContext {

        @Test
        void shouldReturnPrefilledContextForKnownToken() {
            savedRequestedEntry("known-token");

            ReferenceLetterUploadContextDTO context = api.getAndRead(
                String.format(CONTEXT_URL, "known-token"),
                null,
                new TypeReference<>() {},
                200
            );

            assertThat(context.applicantFirstName()).isEqualTo(application.getApplicantFirstName());
            assertThat(context.applicantLastName()).isEqualTo(application.getApplicantLastName());
            assertThat(context.jobTitle()).isEqualTo(jobWithReferences.getTitle());
            assertThat(context.researchGroupName()).isEqualTo(researchGroup.getName());
            assertThat(context.status()).isEqualTo(ReferenceRequestStatus.REQUESTED);
            assertThat(context.confidential()).isTrue();
        }

        @Test
        void shouldReturn404WhenTokenIsUnknown() {
            api.getAndReturnBytes(String.format(CONTEXT_URL, "no-such-token"), null, 404);
        }
    }

    @Nested
    class UploadLetter {

        @Test
        void shouldStoreLetterTransitionRequestToSubmittedAndPromoteApplication() {
            savedRequestedEntry("upload-token");

            ReferenceRequestDTO updated = api.multipartPostAndRead(
                String.format(CONTEXT_URL, "upload-token"),
                List.of(pdf("letter.pdf")),
                new TypeReference<>() {},
                200
            );

            assertThat(updated.status()).isEqualTo(ReferenceRequestStatus.SUBMITTED);
            assertThat(updated.documentId()).isNotNull();

            ReferenceRequest persisted = referenceRequestRepository.findById(updated.referenceRequestId()).orElseThrow();
            assertThat(persisted.getStatus()).isEqualTo(ReferenceRequestStatus.SUBMITTED);
            assertThat(persisted.getDocumentId()).isEqualTo(updated.documentId());

            // The job required exactly 1 letter and we just uploaded the only request, so the
            // application should have been promoted from PENDING back to SENT.
            Application promoted = applicationRepository.findById(application.getApplicationId()).orElseThrow();
            assertThat(promoted.getState()).isEqualTo(ApplicationState.SENT);
        }

        @Test
        void shouldReject400WhenTokenAlreadySubmitted() {
            ReferenceRequest entry = savedRequestedEntry("once-token");
            entry.setStatus(ReferenceRequestStatus.SUBMITTED);
            referenceRequestRepository.save(entry);

            api.multipartPostAndRead(String.format(CONTEXT_URL, "once-token"), List.of(pdf("letter.pdf")), new TypeReference<>() {}, 400);
        }

        @Test
        void shouldReject400WhenTokenIsExpired() {
            ReferenceRequest entry = savedRequestedEntry("expired-token");
            entry.setTokenExpiresAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(1));
            referenceRequestRepository.save(entry);

            api.multipartPostAndRead(
                String.format(CONTEXT_URL, "expired-token"),
                List.of(pdf("letter.pdf")),
                new TypeReference<>() {},
                400
            );
        }
    }

    @Nested
    class DeclineRequest {

        @Test
        void shouldTransitionRequestToDeclined() {
            savedRequestedEntry("decline-token");

            ReferenceRequestDTO updated = api.postAndRead(
                String.format(DECLINE_URL, "decline-token"),
                null,
                ReferenceRequestDTO.class,
                200
            );

            assertThat(updated.status()).isEqualTo(ReferenceRequestStatus.DECLINED);

            ReferenceRequest persisted = referenceRequestRepository.findById(updated.referenceRequestId()).orElseThrow();
            assertThat(persisted.getStatus()).isEqualTo(ReferenceRequestStatus.DECLINED);
        }

        @Test
        void shouldReject400WhenAlreadySubmitted() {
            ReferenceRequest entry = savedRequestedEntry("submitted-token");
            entry.setStatus(ReferenceRequestStatus.SUBMITTED);
            referenceRequestRepository.save(entry);

            api.postAndReturnBytes(String.format(DECLINE_URL, "submitted-token"), null, 400);
        }

        @Test
        void shouldReject400WhenExpired() {
            ReferenceRequest entry = savedRequestedEntry("lapsed-token");
            entry.setTokenExpiresAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(1));
            referenceRequestRepository.save(entry);

            api.postAndReturnBytes(String.format(DECLINE_URL, "lapsed-token"), null, 400);
        }

        @Test
        void shouldReturn404WhenTokenIsUnknown() {
            api.postAndReturnBytes(String.format(DECLINE_URL, "no-such-token"), null, 404);
        }
    }
}
