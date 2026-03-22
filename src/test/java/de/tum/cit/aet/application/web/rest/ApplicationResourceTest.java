package de.tum.cit.aet.application.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationOverviewDTO;
import de.tum.cit.aet.application.domain.dto.DocumentInformationHolderDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.PageResponse;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.ApplicationTestData;
import de.tum.cit.aet.utility.testdata.DocumentTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.core.type.TypeReference;

class ApplicationResourceTest extends AbstractResourceTest {

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
    DocumentRepository documentRepository;

    @Autowired
    DocumentDictionaryRepository documentDictionaryRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    @Value("${aet.storage.root}")
    private String storageRootConfig;

    ResearchGroup researchGroup;
    User professor;
    Applicant applicant;
    Job publishedJob;
    Job draftJob;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        // Setup research group
        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);

        // Setup professor
        professor = UserTestData.savedProfessor(userRepository, researchGroup);

        // Setup applicant profile
        applicant = ApplicantTestData.savedWithNewUser(applicantRepository, userRepository);

        // Setup jobs
        publishedJob = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "AI Engineer Position",
            JobState.PUBLISHED,
            LocalDate.of(2025, 9, 1)
        );

        draftJob = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "ML Researcher (Draft)",
            JobState.DRAFT,
            LocalDate.of(2025, 10, 1)
        );
    }

    // ===== GET APPLICATION BY ID =====
    @Nested
    class GetApplicationByIdTests {

        @Test
        void getApplicationByIdReturnsApplication() {
            Application application = ApplicationTestData.savedAll(
                applicationRepository,
                publishedJob,
                applicant,
                ApplicationState.SENT,
                LocalDate.of(2025, 9, 15),
                "Building web applications",
                "Java, Spring, React",
                "Eager to contribute to research"
            );

            ApplicationForApplicantDTO returnedApp = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/" + application.getApplicationId(), null, ApplicationForApplicantDTO.class, 200);

            assertThat(returnedApp.applicationId()).isEqualTo(application.getApplicationId());
            assertThat(returnedApp.applicationState()).isEqualTo(ApplicationState.SENT);
            assertThat(returnedApp.desiredDate()).isEqualTo(LocalDate.of(2025, 9, 15));
            assertThat(returnedApp.projects()).isEqualTo("Building web applications");
            assertThat(returnedApp.specialSkills()).isEqualTo("Java, Spring, React");
            assertThat(returnedApp.motivation()).isEqualTo("Eager to contribute to research");
            assertThat(returnedApp.job().jobId()).isEqualTo(publishedJob.getJobId());
        }

        @Test
        void getApplicationByIdReturnsNotFoundWhenApplicationDoesNotExist() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/" + UUID.randomUUID(), null, Void.class, 404);

            assertThat(response).isNull();
        }

        @Test
        void getApplicationByIdWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            Void response = api.getAndRead("/api/applications/" + application.getApplicationId(), null, Void.class, 403);
            assertThat(response).isNull();
        }
    }

    // ===== CREATE APPLICATION =====
    @Nested
    class CreateApplicationTests {

        @Test
        void createApplicationPersistsAndReturnsIt() {
            long countBefore = applicationRepository.count();

            ApplicationForApplicantDTO returnedApp = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applications/create/" + publishedJob.getJobId(), null, ApplicationForApplicantDTO.class, 200);

            assertThat(returnedApp.applicationId()).isNotNull();
            assertThat(returnedApp.applicationState()).isEqualTo(ApplicationState.SAVED);
            assertThat(returnedApp.job().jobId()).isEqualTo(publishedJob.getJobId());
            assertThat(applicationRepository.count()).isEqualTo(countBefore + 1);

            Application saved = applicationRepository.findById(returnedApp.applicationId()).orElseThrow();
            assertThat(saved.getJob().getJobId()).isEqualTo(publishedJob.getJobId());
            assertThat(saved.getApplicant().getUserId()).isEqualTo(applicant.getUserId());
            assertThat(saved.getState()).isEqualTo(ApplicationState.SAVED);
        }

        @Test
        void createApplicationWithoutAuthReturnsForbidden() {
            Void response = api.postAndRead("/api/applications/create/" + publishedJob.getJobId(), null, Void.class, 403);
            assertThat(response).isNull();
        }

        @Test
        void createApplicationForNonexistentJobReturnsNotFound() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applications/create/" + UUID.randomUUID(), null, Void.class, 404);

            assertThat(response).isNull();
        }

        @Test
        void createApplicationPrefillsDocumentsFromApplicantProfile() throws Exception {
            DocumentDictionary cvDoc = createApplicantProfileDocument("/testdocs/test-doc1.pdf", "cv.pdf", DocumentType.CV);
            DocumentDictionary referenceDoc = createApplicantProfileDocument(
                "/testdocs/test-doc2.pdf",
                "reference.pdf",
                DocumentType.REFERENCE
            );
            DocumentDictionary bachelorDoc = createApplicantProfileDocument(
                "/testdocs/test-doc3.pdf",
                "bachelor_transcript.pdf",
                DocumentType.BACHELOR_TRANSCRIPT
            );

            ApplicationForApplicantDTO returnedApp = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applications/create/" + publishedJob.getJobId(), null, ApplicationForApplicantDTO.class, 200);

            assertThat(returnedApp.applicationId()).isNotNull();

            Application createdApplication = applicationRepository.findById(returnedApp.applicationId()).orElseThrow();
            assertApplicationHasDocumentIdForType(createdApplication, DocumentType.CV, cvDoc.getDocument().getDocumentId());
            assertApplicationHasDocumentIdForType(createdApplication, DocumentType.REFERENCE, referenceDoc.getDocument().getDocumentId());
            assertApplicationHasDocumentIdForType(
                createdApplication,
                DocumentType.BACHELOR_TRANSCRIPT,
                bachelorDoc.getDocument().getDocumentId()
            );

            Set<DocumentDictionary> applicantCVs = documentDictionaryRepository.findByApplicantAndDocumentType(applicant, DocumentType.CV);
            assertThat(applicantCVs).hasSize(1);
        }

        private DocumentDictionary createApplicantProfileDocument(String sourcePath, String filename, DocumentType documentType)
            throws Exception {
            return DocumentTestData.savedDictionaryWithDocument(
                storageRootConfig,
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                null,
                applicant,
                sourcePath,
                filename,
                documentType,
                filename
            );
        }

        private void assertApplicationHasDocumentIdForType(Application application, DocumentType documentType, UUID expectedDocumentId) {
            Set<DocumentDictionary> documents = documentDictionaryRepository.findByApplicationAndDocumentType(application, documentType);
            assertThat(documents).hasSize(1);
            assertThat(documents.iterator().next().getDocument().getDocumentId()).isEqualTo(expectedDocumentId);
        }
    }

    // ===== UPDATE APPLICATION =====
    @Nested
    class UpdateApplicationTests {

        @Test
        void updateApplicationUpdatesCorrectly() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

            UpdateApplicationDTO updatePayload = new UpdateApplicationDTO(
                application.getApplicationId(),
                ApplicantDTO.getFromEntity(applicant),
                LocalDate.of(2025, 12, 1),
                ApplicationState.SENT,
                "Updated projects description",
                "Java, Kotlin, Spring Boot",
                "I want to update my motivation"
            );

            ApplicationForApplicantDTO returnedApp = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications", updatePayload, ApplicationForApplicantDTO.class, 200);

            assertThat(returnedApp.applicationId()).isEqualTo(application.getApplicationId());
            assertThat(returnedApp.desiredDate()).isEqualTo(LocalDate.of(2025, 12, 1));
            assertThat(returnedApp.projects()).isEqualTo("Updated projects description");
            assertThat(returnedApp.specialSkills()).isEqualTo("Java, Kotlin, Spring Boot");
            assertThat(returnedApp.motivation()).isEqualTo("I want to update my motivation");

            Application updated = applicationRepository.findById(application.getApplicationId()).orElseThrow();
            assertThat(updated.getDesiredStartDate()).isEqualTo(LocalDate.of(2025, 12, 1));
            assertThat(updated.getProjects()).isEqualTo("Updated projects description");
            assertThat(updated.getSpecialSkills()).isEqualTo("Java, Kotlin, Spring Boot");
            assertThat(updated.getMotivation()).isEqualTo("I want to update my motivation");
        }

        @Test
        void sendingApplicationSyncsDocumentsToApplicantProfile() throws Exception {
            // Create application in SAVED state
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);

            // Attach a CV document to the application (not to the applicant profile)
            DocumentDictionary appCv = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                professor,
                application,
                null,
                DocumentType.CV,
                "application_cv.pdf"
            );

            // Sanity: applicant profile initially has no CVs
            assertThat(documentDictionaryRepository.findByApplicantAndDocumentType(applicant, DocumentType.CV)).isEmpty();

            // Send the application (update state to SENT)
            UpdateApplicationDTO updatePayload = new UpdateApplicationDTO(
                application.getApplicationId(),
                ApplicantDTO.getFromEntity(applicant),
                null,
                ApplicationState.SENT,
                null,
                null,
                null
            );

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications", updatePayload, ApplicationForApplicantDTO.class, 200);

            // After sending, the applicant profile should contain the CV from the application
            Set<DocumentDictionary> applicantCvs = documentDictionaryRepository.findByApplicantAndDocumentType(applicant, DocumentType.CV);
            assertThat(applicantCvs).hasSize(1);
            assertThat(applicantCvs.iterator().next().getDocument().getDocumentId()).isEqualTo(appCv.getDocument().getDocumentId());
        }

        @Test
        void sendingApplicationReplacesOldApplicantDocuments() throws Exception {
            // Create an applicant profile CV that should be replaced
            DocumentDictionary existingProfileCv = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                professor,
                null,
                applicant,
                DocumentType.CV,
                "profile_cv_old.pdf"
            );

            // Create application with a different CV
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            DocumentDictionary appCv = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                professor,
                application,
                null,
                DocumentType.CV,
                "application_cv_new.pdf"
            );

            // Confirm pre-conditions
            assertThat(documentDictionaryRepository.findByApplicantAndDocumentType(applicant, DocumentType.CV)).hasSize(1);

            // Send the application
            UpdateApplicationDTO updatePayload = new UpdateApplicationDTO(
                application.getApplicationId(),
                ApplicantDTO.getFromEntity(applicant),
                null,
                ApplicationState.SENT,
                null,
                null,
                null
            );

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications", updatePayload, ApplicationForApplicantDTO.class, 200);

            // After sending, profile CVs should contain only the application's CV
            Set<DocumentDictionary> applicantCvs = documentDictionaryRepository.findByApplicantAndDocumentType(applicant, DocumentType.CV);
            assertThat(applicantCvs).hasSize(1);
            assertThat(applicantCvs.iterator().next().getDocument().getDocumentId()).isEqualTo(appCv.getDocument().getDocumentId());
            // Old profile doc should no longer exist in the profile
            assertThat(documentDictionaryRepository.existsById(existingProfileCv.getDocumentDictionaryId())).isFalse();
        }

        @Test
        void updateApplicationWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

            UpdateApplicationDTO updatePayload = new UpdateApplicationDTO(
                application.getApplicationId(),
                null,
                LocalDate.of(2025, 12, 1),
                ApplicationState.SENT,
                "Updated projects",
                "Updated skills",
                "Updated motivation"
            );

            Void response = api.putAndRead("/api/applications", updatePayload, Void.class, 403);
            assertThat(response).isNull();
        }
    }

    // ===== DELETE APPLICATION =====
    @Nested
    class DeleteApplicationTests {

        @Test
        void deleteApplicationRemovesIt() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                null,
                DocumentType.CV,
                "delete-app-test-cv.pdf"
            );
            assertThat(applicationRepository.existsById(application.getApplicationId())).isTrue();
            assertThat(documentDictionaryRepository.existsById(docDict.getDocumentDictionaryId())).isTrue();

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/" + application.getApplicationId(), null, Void.class, 204);

            assertThat(applicationRepository.existsById(application.getApplicationId())).isFalse();
            assertThat(documentDictionaryRepository.existsById(docDict.getDocumentDictionaryId())).isFalse();
        }

        @Test
        void deleteApplicationNonexistentThrowsNotFound() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/" + UUID.randomUUID(), null, Void.class, 404);

            assertThat(response).isNull();
        }

        @Test
        void deleteApplicationWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            Void response = api.deleteAndRead("/api/applications/" + application.getApplicationId(), null, Void.class, 403);
            assertThat(response).isNull();
        }
    }

    // ===== WITHDRAW APPLICATION =====
    @Nested
    class WithdrawApplicationTests {

        @Test
        void withdrawApplicationMarksAsWithdrawn() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            assertThat(application.getState()).isEqualTo(ApplicationState.SENT);

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications/withdraw/" + application.getApplicationId(), null, Void.class, 200);

            Application withdrawn = applicationRepository.findById(application.getApplicationId()).orElseThrow();
            assertThat(withdrawn.getState()).isEqualTo(ApplicationState.WITHDRAWN);
        }

        @Test
        void withdrawApplicationNonexistentThrowsNotFound() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications/withdraw/" + UUID.randomUUID(), null, Void.class, 404);

            assertThat(response).isNull();
        }

        @Test
        void withdrawApplicationWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            Void response = api.putAndRead("/api/applications/withdraw/" + application.getApplicationId(), null, Void.class, 403);
            assertThat(response).isNull();
        }
    }

    // ===== GET APPLICATION PAGES =====
    @Nested
    class ApplicationPagesTests {

        @Test
        void getApplicationPagesReturnsApplicationsWithCorrectDetails() {
            ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            Application reviewApp = ApplicationTestData.savedAll(
                applicationRepository,
                publishedJob,
                applicant,
                ApplicationState.IN_REVIEW,
                LocalDate.of(2025, 11, 15),
                "Robotics and AI projects",
                "Machine Learning, Python, TensorFlow",
                "Passionate about AI research"
            );
            ApplicationTestData.savedAccepted(applicationRepository, draftJob, applicant);

            PageResponse<ApplicationOverviewDTO> applications = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/pages?pageSize=10&pageNumber=0", null, new TypeReference<>() {}, 200);

            assertThat(applications.content().size()).isEqualTo(3);

            // Verify one application has correct details
            ApplicationDetailDTO detailDTO = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/" + reviewApp.getApplicationId() + "/detail", null, ApplicationDetailDTO.class, 200);

            assertThat(detailDTO.applicationId()).isEqualTo(reviewApp.getApplicationId());
            assertThat(detailDTO.jobId()).isEqualTo(publishedJob.getJobId());
            assertThat(detailDTO.applicationState()).isEqualTo(ApplicationState.IN_REVIEW);
            assertThat(detailDTO.jobTitle()).isEqualTo("AI Engineer Position");
            assertThat(detailDTO.desiredDate()).isEqualTo(LocalDate.of(2025, 11, 15));
            assertThat(detailDTO.projects()).isEqualTo("Robotics and AI projects");
            assertThat(detailDTO.specialSkills()).isEqualTo("Machine Learning, Python, TensorFlow");
            assertThat(detailDTO.motivation()).isEqualTo("Passionate about AI research");
            assertThat(detailDTO.supervisingProfessorName()).isEqualTo("Alice Smith");
            assertThat(detailDTO.researchGroup()).isEqualTo("Test Group");
        }

        @Test
        void getApplicationPagesWithPaginationWorks() {
            // Create multiple applications
            for (int i = 0; i < 30; i++) {
                ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            }

            PageResponse<ApplicationOverviewDTO> page1 = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/pages?pageSize=10&pageNumber=0", null, new TypeReference<>() {}, 200);

            PageResponse<ApplicationOverviewDTO> page2 = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/pages?pageSize=10&pageNumber=1", null, new TypeReference<>() {}, 200);

            assertThat(page1.content().size()).isEqualTo(10);
            assertThat(page2.content().size()).isEqualTo(10);
        }

        @Test
        void getApplicationPagesInvalidPaginationReturnsError() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/pages?pageSize=10&pageNumber=-1", null, Void.class, 400);

            assertThat(response).isNull();
        }

        @Test
        void getApplicationPagesWithoutAuthReturnsForbidden() {
            Void response = api.getAndRead("/api/applications/pages?pageSize=10&pageNumber=0", null, Void.class, 403);
            assertThat(response).isNull();
        }
    }

    // ===== GET APPLICATION DETAIL =====
    @Nested
    class ApplicationDetailTests {

        @Test
        void getApplicationDetailNonexistentThrowsNotFound() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/" + UUID.randomUUID() + "/detail", null, Void.class, 404);

            assertThat(response).isNull();
        }

        @Test
        void getApplicationDetailWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            Void response = api.getAndRead("/api/applications/" + application.getApplicationId() + "/detail", null, Void.class, 403);
            assertThat(response).isNull();
        }
    }

    // ===== GET DOCUMENT IDS =====
    @Nested
    class DocumentIdsTests {

        @Test
        void getDocumentIdsReturnsEmptySetForNewApplication() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

            Map<?, ?> response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/getDocumentIds/" + application.getApplicationId(), null, Map.class, 200);

            assertThat(response).isEmpty();
        }

        @Test
        void getDocumentIdsNonexistentThrowsNotFound() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/getDocumentIds/" + UUID.randomUUID(), null, Void.class, 404);

            assertThat(response).isNull();
        }

        @Test
        void getDocumentIdsWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            Void response = api.getAndRead("/api/applications/getDocumentIds/" + application.getApplicationId(), null, Void.class, 403);
            assertThat(response).isNull();
        }
    }

    // ===== DELETE DOCUMENT FROM APPLICATION =====
    @Nested
    class DeleteDocumentFromApplicationTests {

        @Test
        void deleteDocumentFromApplicationRemovesIt() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                null,
                DocumentType.CV,
                "test_cv.pdf"
            );

            assertThat(documentDictionaryRepository.existsById(docDict.getDocumentDictionaryId())).isTrue();

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/documents/" + docDict.getDocumentDictionaryId(), null, Void.class, 204);

            assertThat(documentDictionaryRepository.existsById(docDict.getDocumentDictionaryId())).isFalse();
        }

        @Test
        void deleteDocumentFromApplicationNonexistentThrowsNotFound() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/documents/" + UUID.randomUUID(), null, Void.class, 404);

            assertThat(response).isNull();
        }

        @Test
        void deleteDocumentFromApplicationWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                null,
                DocumentType.CV,
                "test_cv.pdf"
            );

            Void response = api.deleteAndRead("/api/applications/documents/" + docDict.getDocumentDictionaryId(), null, Void.class, 403);
            assertThat(response).isNull();
        }

        @Test
        void deleteDocumentFromSentApplicationReturnsBadRequest() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                null,
                DocumentType.CV,
                "test_cv.pdf"
            );

            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/documents/" + docDict.getDocumentDictionaryId(), null, Void.class, 400);

            assertThat(response).isNull();
        }
    }

    // ===== RENAME DOCUMENT =====
    @Nested
    class RenameDocumentTests {

        @Test
        void renameDocumentUpdatesName() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                null,
                DocumentType.CV,
                "original_name.pdf"
            );

            assertThat(docDict.getName()).isEqualTo("original_name.pdf");

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(
                    "/api/applications/documents/" + docDict.getDocumentDictionaryId() + "/name?newName=new_cv_name.pdf",
                    null,
                    Void.class,
                    200
                );

            DocumentDictionary updated = documentDictionaryRepository.findById(docDict.getDocumentDictionaryId()).orElseThrow();
            assertThat(updated.getName()).isEqualTo("new_cv_name.pdf");
        }

        @Test
        void renameDocumentNonexistentThrowsNotFound() {
            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications/documents/" + UUID.randomUUID() + "/name?newName=new_name.pdf", null, Void.class, 404);

            assertThat(response).isNull();
        }

        @Test
        void renameDocumentWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                null,
                DocumentType.CV,
                "test_cv.pdf"
            );

            Void response = api.putAndRead(
                "/api/applications/documents/" + docDict.getDocumentDictionaryId() + "/name?newName=renamed.pdf",
                null,
                Void.class,
                403
            );

            assertThat(response).isNull();
        }

        @Test
        void renameDocumentForSentApplicationReturnsBadRequest() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                null,
                DocumentType.CV,
                "test_cv.pdf"
            );

            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(
                    "/api/applications/documents/" + docDict.getDocumentDictionaryId() + "/name?newName=renamed.pdf",
                    null,
                    Void.class,
                    400
                );

            assertThat(response).isNull();
        }
    }

    // ===== UPLOAD DOCUMENTS =====
    @Nested
    class UploadDocumentsTests {

        @Test
        void uploadDocumentsUploadsSuccessfully() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);

            MockMultipartFile file = DocumentTestData.createMockPdfFile("files", "bachelor_transcript.pdf", "PDF content here");

            Set<DocumentInformationHolderDTO> uploadedDocs = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .multipartPostAndRead(
                    "/api/applications/" + application.getApplicationId() + "/documents/" + DocumentType.BACHELOR_TRANSCRIPT,
                    List.of(file),
                    new TypeReference<>() {},
                    200
                );

            assertThat(uploadedDocs).hasSize(1);
            DocumentInformationHolderDTO uploadedDoc = uploadedDocs.iterator().next();
            assertThat(uploadedDoc.getId()).isNotNull();
            assertThat(uploadedDoc.getName()).isEqualTo("bachelor_transcript.pdf");
            assertThat(uploadedDoc.getSize()).isEqualTo("PDF content here".getBytes().length);
        }

        @Test
        void uploadDocumentsForNonexistentApplicationThrowsNotFound() {
            MockMultipartFile file = DocumentTestData.createMockPdfFile("files", "transcript.pdf", "PDF content");

            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .multipartPostAndRead(
                    "/api/applications/" + UUID.randomUUID() + "/documents/" + DocumentType.BACHELOR_TRANSCRIPT,
                    List.of(file),
                    new TypeReference<Void>() {},
                    404
                );

            assertThat(response).isNull();
        }

        @Test
        void uploadDocumentsWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            MockMultipartFile file = DocumentTestData.createMockPdfFile("files", "transcript.pdf", "PDF content");

            Void response = api.multipartPostAndRead(
                "/api/applications/" + application.getApplicationId() + "/documents/" + DocumentType.MASTER_TRANSCRIPT,
                List.of(file),
                new TypeReference<Void>() {},
                403
            );

            assertThat(response).isNull();
        }

        @Test
        void uploadDocumentsForSentApplicationReturnsBadRequest() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            MockMultipartFile file = DocumentTestData.createMockPdfFile("files", "transcript.pdf", "PDF content");

            Void response = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .multipartPostAndRead(
                    "/api/applications/" + application.getApplicationId() + "/documents/" + DocumentType.MASTER_TRANSCRIPT,
                    List.of(file),
                    new TypeReference<Void>() {},
                    400
                );

            assertThat(response).isNull();
        }
    }
}
