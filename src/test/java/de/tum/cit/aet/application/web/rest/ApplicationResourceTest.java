package de.tum.cit.aet.application.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
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
import de.tum.cit.aet.usermanagement.dto.UserDTO;
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
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mock.web.MockMultipartFile;

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
        applicant = ApplicantTestData.savedWithNewUser(applicantRepository);

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

    // ===== APPLICANT PROFILE =====
    @Nested
    class ApplicantProfileTests {

        @Test
        void getApplicantProfileReturnsProfileWithPersonalInformation() {
            ApplicantDTO profile = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/profile", null, ApplicantDTO.class, 200);

            assertThat(profile).isNotNull();
            assertThat(profile.user()).isNotNull();
            assertThat(profile.user().userId()).isEqualTo(applicant.getUserId());
            assertThat(profile.user().email()).isEqualTo(applicant.getUser().getEmail());
            assertThat(profile.user().firstName()).isEqualTo(applicant.getUser().getFirstName());
            assertThat(profile.user().lastName()).isEqualTo(applicant.getUser().getLastName());
            assertThat(profile.street()).isEqualTo(applicant.getStreet());
            assertThat(profile.city()).isEqualTo(applicant.getCity());
            assertThat(profile.country()).isEqualTo(applicant.getCountry());
        }

        @Test
        void getApplicantProfileWithoutAuthReturnsForbidden() {
            api.getAndRead("/api/applications/profile", null, ApplicantDTO.class, 403);
        }

        @Test
        void updateApplicantProfileUpdatesPersonalInformation() {
            UserDTO updatedUserDTO = new UserDTO(
                applicant.getUserId(),
                "updated.email@example.com",
                applicant.getUser().getAvatar(),
                "UpdatedFirstName",
                "UpdatedLastName",
                "Other",
                "German",
                LocalDate.of(1995, 5, 15),
                "+49123456789",
                "https://updated-website.com",
                "https://linkedin.com/in/updated",
                "en",
                null
            );

            ApplicantDTO updatePayload = new ApplicantDTO(
                updatedUserDTO,
                "Updated Street 123",
                "80333",
                "Munich",
                "Germany",
                "Computer Science",
                "2.0",
                "5.0",
                "1.5",
                "Technical University of Munich",
                "Informatics",
                "1.0",
                "5.0",
                "1.3",
                "TUM"
            );

            ApplicantDTO updatedProfile = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications/profile", updatePayload, ApplicantDTO.class, 200);

            assertThat(updatedProfile).isNotNull();
            assertThat(updatedProfile.user().email()).isEqualTo("updated.email@example.com");
            assertThat(updatedProfile.user().firstName()).isEqualTo("UpdatedFirstName");
            assertThat(updatedProfile.user().lastName()).isEqualTo("UpdatedLastName");
            assertThat(updatedProfile.user().gender()).isEqualTo("Other");
            assertThat(updatedProfile.user().nationality()).isEqualTo("German");
            assertThat(updatedProfile.street()).isEqualTo("Updated Street 123");
            assertThat(updatedProfile.postalCode()).isEqualTo("80333");
            assertThat(updatedProfile.city()).isEqualTo("Munich");
            assertThat(updatedProfile.country()).isEqualTo("Germany");
            assertThat(updatedProfile.bachelorDegreeName()).isEqualTo("Computer Science");
            assertThat(updatedProfile.bachelorGrade()).isEqualTo("1.5");
            assertThat(updatedProfile.masterDegreeName()).isEqualTo("Informatics");
            assertThat(updatedProfile.masterGrade()).isEqualTo("1.3");

            // Verify persistence
            Applicant persistedApplicant = applicantRepository.findById(applicant.getUserId()).orElseThrow();
            assertThat(persistedApplicant.getUser().getEmail()).isEqualTo("updated.email@example.com");
            assertThat(persistedApplicant.getUser().getFirstName()).isEqualTo("UpdatedFirstName");
            assertThat(persistedApplicant.getUser().getLastName()).isEqualTo("UpdatedLastName");
            assertThat(persistedApplicant.getStreet()).isEqualTo("Updated Street 123");
            assertThat(persistedApplicant.getCity()).isEqualTo("Munich");
            assertThat(persistedApplicant.getBachelorDegreeName()).isEqualTo("Computer Science");
            assertThat(persistedApplicant.getMasterGrade()).isEqualTo("1.3");
        }

        @Test
        void updateApplicantProfileWithNullUserReturnsBadRequest() {
            ApplicantDTO invalidPayload = new ApplicantDTO(
                null,
                "Street 123",
                "80333",
                "Munich",
                "Germany",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications/profile", invalidPayload, ApplicantDTO.class, 400);
        }

        @Test
        void updateApplicantProfileWithoutAuthReturnsForbidden() {
            UserDTO userDTO = new UserDTO(
                applicant.getUserId(),
                applicant.getUser().getEmail(),
                applicant.getUser().getAvatar(),
                "FirstName",
                "LastName",
                "Male",
                "German",
                LocalDate.of(1990, 1, 1),
                null,
                null,
                null,
                "en",
                null
            );

            ApplicantDTO updatePayload = new ApplicantDTO(
                userDTO,
                "Street",
                "12345",
                "City",
                "Country",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );

            api.putAndRead("/api/applications/profile", updatePayload, ApplicantDTO.class, 403);
        }

        @Test
        void updateApplicantProfileWithPartialDataUpdatesOnlyProvidedFields() {
            // Create a DTO with only some fields updated
            UserDTO partialUserDTO = new UserDTO(
                applicant.getUserId(),
                applicant.getUser().getEmail(),
                applicant.getUser().getAvatar(),
                "NewFirstName",
                applicant.getUser().getLastName(),
                applicant.getUser().getGender(),
                applicant.getUser().getNationality(),
                applicant.getUser().getBirthday(),
                applicant.getUser().getPhoneNumber(),
                applicant.getUser().getWebsite(),
                applicant.getUser().getLinkedinUrl(),
                "en",
                null
            );

            ApplicantDTO partialUpdate = new ApplicantDTO(
                partialUserDTO,
                "New Street",
                applicant.getPostalCode(),
                applicant.getCity(),
                applicant.getCountry(),
                applicant.getBachelorDegreeName(),
                applicant.getBachelorGradeUpperLimit(),
                applicant.getBachelorGradeLowerLimit(),
                applicant.getBachelorGrade(),
                applicant.getBachelorUniversity(),
                applicant.getMasterDegreeName(),
                applicant.getMasterGradeUpperLimit(),
                applicant.getMasterGradeLowerLimit(),
                applicant.getMasterGrade(),
                applicant.getMasterUniversity()
            );

            ApplicantDTO updated = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications/profile", partialUpdate, ApplicantDTO.class, 200);

            assertThat(updated.user().firstName()).isEqualTo("NewFirstName");
            assertThat(updated.user().lastName()).isEqualTo(applicant.getUser().getLastName());
            assertThat(updated.street()).isEqualTo("New Street");
            assertThat(updated.city()).isEqualTo(applicant.getCity());
        }
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
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/" + UUID.randomUUID(), null, Void.class, 404);
        }

        @Test
        void getApplicationByIdWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            api.getAndRead("/api/applications/" + application.getApplicationId(), null, ApplicationForApplicantDTO.class, 403);
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
            api.postAndRead("/api/applications/create/" + publishedJob.getJobId(), null, ApplicationForApplicantDTO.class, 403);
        }

        @Test
        void createApplicationForNonexistentJobReturnsNotFound() {
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applications/create/" + UUID.randomUUID(), null, ApplicationForApplicantDTO.class, 404);
        }

        @Test
        void createApplicationPrefillsDocumentsFromApplicantProfile() throws Exception {
            // Upload documents to applicant profile
            DocumentDictionary cvDoc = DocumentTestData.savedDictionaryWithDocument(
                storageRootConfig,
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                null,
                applicant,
                "/testdocs/test-doc1.pdf",
                "cv.pdf",
                DocumentType.CV,
                "cv.pdf"
            );
            DocumentDictionary referenceDoc = DocumentTestData.savedDictionaryWithDocument(
                storageRootConfig,
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                null,
                applicant,
                "/testdocs/test-doc2.pdf",
                "reference.pdf",
                DocumentType.REFERENCE,
                "reference.pdf"
            );
            DocumentDictionary bachelorDoc = DocumentTestData.savedDictionaryWithDocument(
                storageRootConfig,
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                null,
                applicant,
                "/testdocs/test-doc3.pdf",
                "bachelor_transcript.pdf",
                DocumentType.BACHELOR_TRANSCRIPT,
                "bachelor_transcript.pdf"
            );

            // Create new application
            ApplicationForApplicantDTO returnedApp = api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .postAndRead("/api/applications/create/" + publishedJob.getJobId(), null, ApplicationForApplicantDTO.class, 200);

            assertThat(returnedApp.applicationId()).isNotNull();

            // Verify documents were prefilled to the application
            Set<DocumentDictionary> applicationCVs = documentDictionaryRepository.findByApplicationApplicationIdAndDocumentType(
                returnedApp.applicationId(),
                DocumentType.CV
            );
            assertThat(applicationCVs).hasSize(1);
            assertThat(applicationCVs.iterator().next().getDocument().getDocumentId()).isEqualTo(cvDoc.getDocument().getDocumentId());

            Set<DocumentDictionary> applicationReferences = documentDictionaryRepository.findByApplicationApplicationIdAndDocumentType(
                returnedApp.applicationId(),
                DocumentType.REFERENCE
            );
            assertThat(applicationReferences).hasSize(1);
            assertThat(applicationReferences.iterator().next().getDocument().getDocumentId()).isEqualTo(
                referenceDoc.getDocument().getDocumentId()
            );

            Set<DocumentDictionary> applicationBachelorTranscripts =
                documentDictionaryRepository.findByApplicationApplicationIdAndDocumentType(
                    returnedApp.applicationId(),
                    DocumentType.BACHELOR_TRANSCRIPT
                );
            assertThat(applicationBachelorTranscripts).hasSize(1);
            assertThat(applicationBachelorTranscripts.iterator().next().getDocument().getDocumentId()).isEqualTo(
                bachelorDoc.getDocument().getDocumentId()
            );

            // Verify original applicant profile documents are still intact
            Set<DocumentDictionary> applicantCVs = documentDictionaryRepository.findByApplicantAndDocumentType(applicant, DocumentType.CV);
            assertThat(applicantCVs).hasSize(1);
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

            api.putAndRead("/api/applications", updatePayload, ApplicationForApplicantDTO.class, 403);
        }
    }

    // ===== DELETE APPLICATION =====
    @Nested
    class DeleteApplicationTests {

        @Test
        void deleteApplicationRemovesIt() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            assertThat(applicationRepository.existsById(application.getApplicationId())).isTrue();

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/" + application.getApplicationId(), null, Void.class, 204);

            assertThat(applicationRepository.existsById(application.getApplicationId())).isFalse();
        }

        @Test
        void deleteApplicationNonexistentThrowsNotFound() {
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/" + UUID.randomUUID(), null, Void.class, 404);
        }

        @Test
        void deleteApplicationWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            api.deleteAndRead("/api/applications/" + application.getApplicationId(), null, Void.class, 403);
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
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications/withdraw/" + UUID.randomUUID(), null, Void.class, 404);
        }

        @Test
        void withdrawApplicationWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            api.putAndRead("/api/applications/withdraw/" + application.getApplicationId(), null, Void.class, 403);
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
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/pages?pageSize=10&pageNumber=-1", null, new TypeReference<>() {}, 400);
        }

        @Test
        void getApplicationPagesWithoutAuthReturnsForbidden() {
            api.getAndRead("/api/applications/pages?pageSize=10&pageNumber=0", null, new TypeReference<>() {}, 403);
        }
    }

    // ===== GET APPLICATION DETAIL =====
    @Nested
    class ApplicationDetailTests {

        @Test
        void getApplicationDetailNonexistentThrowsNotFound() {
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/" + UUID.randomUUID() + "/detail", null, ApplicationDetailDTO.class, 404);
        }

        @Test
        void getApplicationDetailWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            api.getAndRead("/api/applications/" + application.getApplicationId() + "/detail", null, ApplicationDetailDTO.class, 403);
        }
    }

    // ===== GET DOCUMENT IDS =====
    @Nested
    class DocumentIdsTests {

        @Test
        void getDocumentIdsReturnsEmptySetForNewApplication() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/getDocumentIds/" + application.getApplicationId(), null, Object.class, 200);
        }

        @Test
        void getDocumentIdsNonexistentThrowsNotFound() {
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .getAndRead("/api/applications/getDocumentIds/" + UUID.randomUUID(), null, Object.class, 404);
        }

        @Test
        void getDocumentIdsWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            api.getAndRead("/api/applications/getDocumentIds/" + application.getApplicationId(), null, Object.class, 403);
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
                applicant,
                DocumentType.CV,
                "test_cv.pdf"
            );

            assertThat(documentDictionaryRepository.existsById(docDict.getDocumentDictionaryId())).isTrue();

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/delete-document/" + docDict.getDocumentDictionaryId(), null, Void.class, 204);

            assertThat(documentDictionaryRepository.existsById(docDict.getDocumentDictionaryId())).isFalse();
        }

        @Test
        void deleteDocumentFromApplicationNonexistentThrowsNotFound() {
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/delete-document/" + UUID.randomUUID(), null, Void.class, 404);
        }

        @Test
        void deleteDocumentFromApplicationWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                applicant,
                DocumentType.CV,
                "test_cv.pdf"
            );

            api.deleteAndRead("/api/applications/delete-document/" + docDict.getDocumentDictionaryId(), null, Void.class, 403);
        }

        @Test
        void deleteDocumentFromSentApplicationReturnsBadRequest() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                applicant,
                DocumentType.CV,
                "test_cv.pdf"
            );

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .deleteAndRead("/api/applications/delete-document/" + docDict.getDocumentDictionaryId(), null, Void.class, 400);
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
                applicant,
                DocumentType.CV,
                "original_name.pdf"
            );

            assertThat(docDict.getName()).isEqualTo("original_name.pdf");

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(
                    "/api/applications/rename-document/" + docDict.getDocumentDictionaryId() + "?newName=new_cv_name.pdf",
                    null,
                    Void.class,
                    200
                );

            DocumentDictionary updated = documentDictionaryRepository.findById(docDict.getDocumentDictionaryId()).orElseThrow();
            assertThat(updated.getName()).isEqualTo("new_cv_name.pdf");
        }

        @Test
        void renameDocumentNonexistentThrowsNotFound() {
            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead("/api/applications/rename-document/" + UUID.randomUUID() + "?newName=new_name.pdf", null, Void.class, 404);
        }

        @Test
        void renameDocumentWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                applicant,
                DocumentType.CV,
                "test_cv.pdf"
            );

            api.putAndRead(
                "/api/applications/rename-document/" + docDict.getDocumentDictionaryId() + "?newName=renamed.pdf",
                null,
                Void.class,
                403
            );
        }

        @Test
        void renameDocumentForSentApplicationReturnsBadRequest() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            DocumentDictionary docDict = DocumentTestData.savedDictionaryWithMockDocument(
                documentRepository,
                documentDictionaryRepository,
                applicant.getUser(),
                application,
                applicant,
                DocumentType.CV,
                "test_cv.pdf"
            );

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .putAndRead(
                    "/api/applications/rename-document/" + docDict.getDocumentDictionaryId() + "?newName=renamed.pdf",
                    null,
                    Void.class,
                    400
                );
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
                    "/api/applications/upload-documents/" + application.getApplicationId() + "/" + DocumentType.BACHELOR_TRANSCRIPT,
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

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .multipartPostAndRead(
                    "/api/applications/upload-documents/" + UUID.randomUUID() + "/" + DocumentType.BACHELOR_TRANSCRIPT,
                    List.of(file),
                    new TypeReference<>() {},
                    404
                );
        }

        @Test
        void uploadDocumentsWithoutAuthReturnsForbidden() {
            Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SAVED);
            MockMultipartFile file = DocumentTestData.createMockPdfFile("files", "transcript.pdf", "PDF content");

            api.multipartPostAndRead(
                "/api/applications/upload-documents/" + application.getApplicationId() + "/" + DocumentType.MASTER_TRANSCRIPT,
                List.of(file),
                new TypeReference<>() {},
                403
            );
        }

        @Test
        void uploadDocumentsForSentApplicationReturnsBadRequest() {
            Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
            MockMultipartFile file = DocumentTestData.createMockPdfFile("files", "transcript.pdf", "PDF content");

            api
                .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
                .multipartPostAndRead(
                    "/api/applications/upload-documents/" + application.getApplicationId() + "/" + DocumentType.MASTER_TRANSCRIPT,
                    List.of(file),
                    new TypeReference<>() {},
                    400
                );
        }
    }
}
