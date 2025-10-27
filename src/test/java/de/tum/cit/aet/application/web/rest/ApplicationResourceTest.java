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
import de.tum.cit.aet.core.domain.Document;
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
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.ApplicationTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;

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

    ResearchGroup researchGroup;
    User professor;
    Applicant applicant;
    Job publishedJob;
    Job draftJob;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        // Setup research group
        researchGroup = ResearchGroupTestData.savedAll(
            researchGroupRepository,
            "Prof. Smith",
            "AI Research Group",
            "ai@example.com",
            "AI",
            "CS",
            "We do cutting edge AI research",
            "ai@example.com",
            "80333",
            "CIT",
            "Arcisstr. 21",
            "https://ai.tum.de"
        );

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

    // ===== GET APPLICATION BY ID =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationByIdReturnsApplication() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

        ApplicationForApplicantDTO returnedApp = api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/" + application.getApplicationId(), null, ApplicationForApplicantDTO.class, 200);

        assertThat(returnedApp.applicationId()).isEqualTo(application.getApplicationId());
        assertThat(returnedApp.applicationState()).isEqualTo(ApplicationState.SENT);
        assertThat(returnedApp.desiredDate()).isEqualTo(application.getDesiredStartDate());
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationByIdNonexistentThrowsNotFound() {
        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/" + UUID.randomUUID(), null, ApplicationForApplicantDTO.class, 404);
    }

    @Test
    void getApplicationByIdWithoutAuthReturnsForbidden() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        api.getAndRead("/api/applications/" + application.getApplicationId(), null, ApplicationForApplicantDTO.class, 403);
    }

    // ===== CREATE APPLICATION =====

    @Test
    @WithMockUser(roles = "APPLICANT")
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
    @WithMockUser(roles = "APPLICANT")
    void createApplicationForNonexistentJobReturnsNotFound() {
        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .postAndRead("/api/applications/create/" + UUID.randomUUID(), null, ApplicationForApplicantDTO.class, 404);
    }

    // ===== UPDATE APPLICATION =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void updateApplicationUpdatesCorrectly() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

        UpdateApplicationDTO updatePayload = new UpdateApplicationDTO(
            application.getApplicationId(),
            ApplicantDTO.getFromEntity(applicant), // applicantDTO - can be null in this context
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

    // ===== DELETE APPLICATION =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void deleteApplicationRemovesIt() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        assertThat(applicationRepository.existsById(application.getApplicationId())).isTrue();

        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .deleteAndRead("/api/applications/" + application.getApplicationId(), null, Void.class, 204);

        assertThat(applicationRepository.existsById(application.getApplicationId())).isFalse();
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void deleteApplicationNonexistentThrowsNotFound() {
        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .deleteAndRead("/api/applications/" + UUID.randomUUID(), null, Void.class, 404);
    }

    @Test
    void deleteApplicationWithoutAuthReturnsForbidden() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        api.deleteAndRead("/api/applications/" + application.getApplicationId(), null, Void.class, 401);
    }

    // ===== WITHDRAW APPLICATION =====

    @Test
    @WithMockUser(roles = "APPLICANT")
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
    @WithMockUser(roles = "APPLICANT")
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

    // ===== GET APPLICATION PAGES =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationPagesReturnsApplications() {
        ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        ApplicationTestData.savedInReview(applicationRepository, publishedJob, applicant);
        ApplicationTestData.savedAccepted(applicationRepository, draftJob, applicant);

        List<ApplicationOverviewDTO> applications = api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/pages?pageSize=10&pageNumber=0", null, new TypeReference<>() {}, 200);

        assertThat(applications).hasSize(3);
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationPagesWithPaginationWorks() {
        // Create multiple applications
        for (int i = 0; i < 30; i++) {
            ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        }

        List<ApplicationOverviewDTO> page1 = api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/pages?pageSize=10&pageNumber=0", null, new TypeReference<>() {}, 200);

        List<ApplicationOverviewDTO> page2 = api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/pages?pageSize=10&pageNumber=1", null, new TypeReference<>() {}, 200);

        assertThat(page1).hasSize(10);
        assertThat(page2).hasSize(10);
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationPagesInvalidPaginationReturnsError() {
        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/pages?pageSize=10&pageNumber=-1", null, new TypeReference<>() {}, 400);
    }

    @Test
    void getApplicationPagesWithoutAuthReturnsForbidden() {
        api.getAndRead("/api/applications/pages?pageSize=10&pageNumber=0", null, new TypeReference<>() {}, 403);
    }

    // ===== GET APPLICATION PAGES LENGTH =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationPagesLengthReturnsCorrectCount() {
        ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        ApplicationTestData.savedAccepted(applicationRepository, draftJob, applicant);

        Long count = api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/pages/length/" + applicant.getUserId(), null, Long.class, 200);

        assertThat(count).isEqualTo(3);
    }

    @Test
    void getApplicationPagesLengthWithoutAuthReturnsForbidden() {
        api.getAndRead("/api/applications/pages/length/" + applicant.getUserId().toString(), null, Void.class, 403);
    }

    // ===== GET APPLICATION DETAIL =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationDetailReturnsCorrectDetails() {
        Application application = ApplicationTestData.savedAll(
            applicationRepository,
            publishedJob,
            applicant,
            ApplicationState.IN_REVIEW,
            LocalDate.of(2025, 11, 15),
            "Robotics and AI projects",
            "Machine Learning, Python, TensorFlow",
            "Passionate about AI research"
        );

        ApplicationDetailDTO detailDTO = api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/" + application.getApplicationId() + "/detail", null, ApplicationDetailDTO.class, 200);

        assertThat(detailDTO.applicationId()).isEqualTo(application.getApplicationId());
        assertThat(detailDTO.jobId()).isEqualTo(publishedJob.getJobId());
        assertThat(detailDTO.applicationState()).isEqualTo(ApplicationState.IN_REVIEW);
        assertThat(detailDTO.jobTitle()).isEqualTo("AI Engineer Position");
        assertThat(detailDTO.desiredDate()).isEqualTo(LocalDate.of(2025, 11, 15));
        assertThat(detailDTO.projects()).isEqualTo("Robotics and AI projects");
        assertThat(detailDTO.specialSkills()).isEqualTo("Machine Learning, Python, TensorFlow");
        assertThat(detailDTO.motivation()).isEqualTo("Passionate about AI research");
        assertThat(detailDTO.supervisingProfessorName()).isEqualTo("Alice Smith");
        assertThat(detailDTO.researchGroup()).isEqualTo("AI Research Group");
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
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

    // ===== GET DOCUMENT IDS =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getDocumentIdsReturnsEmptySetForNewApplication() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/getDocumentIds/" + application.getApplicationId(), null, Object.class, 200);
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
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

    // ===== DELETE DOCUMENT FROM APPLICATION =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void deleteDocumentFromApplicationRemovesIt() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        DocumentDictionary docDict = createTestDocument(application, applicant.getUser(), DocumentType.CV, "test_cv.pdf");

        assertThat(documentDictionaryRepository.existsById(docDict.getDocumentDictionaryId())).isTrue();

        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .deleteAndRead("/api/applications/delete-document/" + docDict.getDocumentDictionaryId(), null, Void.class, 204);

        assertThat(documentDictionaryRepository.existsById(docDict.getDocumentDictionaryId())).isFalse();
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void deleteDocumentFromApplicationNonexistentThrowsNotFound() {
        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .deleteAndRead("/api/applications/delete-document/" + UUID.randomUUID(), null, Void.class, 404);
    }

    @Test
    void deleteDocumentFromApplicationWithoutAuthReturnsForbidden() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        DocumentDictionary docDict = createTestDocument(application, applicant.getUser(), DocumentType.CV, "test_cv.pdf");

        api.deleteAndRead("/api/applications/delete-document/" + docDict.getDocumentDictionaryId(), null, Void.class, 403);
    }

    // ===== RENAME DOCUMENT =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void renameDocumentUpdatesName() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        DocumentDictionary docDict = createTestDocument(application, applicant.getUser(), DocumentType.CV, "original_name.pdf");

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
    @WithMockUser(roles = "APPLICANT")
    void renameDocumentNonexistentThrowsNotFound() {
        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .putAndRead("/api/applications/rename-document/" + UUID.randomUUID() + "?newName=new_name.pdf", null, Void.class, 404);
    }

    @Test
    void renameDocumentWithoutAuthReturnsForbidden() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        DocumentDictionary docDict = createTestDocument(application, applicant.getUser(), DocumentType.CV, "test_cv.pdf");

        api.putAndRead(
            "/api/applications/rename-document/" + docDict.getDocumentDictionaryId() + "?newName=renamed.pdf",
            null,
            Void.class,
            403
        );
    }

    // ===== UPLOAD DOCUMENTS =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void uploadDocumentsUploadsSuccessfully() {
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

        MockMultipartFile file = new MockMultipartFile(
            "files",
            "bachelor_transcript.pdf",
            "application/pdf",
            "PDF content here".getBytes()
        );

        Set<DocumentInformationHolderDTO> uploadedDocs = api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .multipartPostAndRead(
                "/api/applications/upload-documents/" + application.getApplicationId() + "/" + DocumentType.BACHELOR_TRANSCRIPT,
                List.of(file),
                new TypeReference<>() {},
                200
            );

        assertThat(uploadedDocs).isNotEmpty();
    }

    @Test
    @WithMockUser(roles = "APPLICANT")
    void uploadDocumentsForNonexistentApplicationThrowsNotFound() {
        MockMultipartFile file = new MockMultipartFile("files", "transcript.pdf", "application/pdf", "PDF content".getBytes());

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
        Application application = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);

        MockMultipartFile file = new MockMultipartFile("files", "transcript.pdf", "application/pdf", "PDF content".getBytes());

        api.multipartPostAndRead(
            "/api/applications/upload-documents/" + application.getApplicationId() + "/" + DocumentType.MASTER_TRANSCRIPT,
            List.of(file),
            new TypeReference<>() {},
            403
        );
    }

    // ===== GET APPLICATION BY ID - 404 BRANCH =====

    @Test
    @WithMockUser(roles = "APPLICANT")
    void getApplicationByIdReturnsNotFoundWhenApplicationDoesNotExist() {
        api
            .with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"))
            .getAndRead("/api/applications/" + UUID.randomUUID(), null, Void.class, 404);
    }

    // ===== HELPER METHODS =====

    /**
     * Creates a test document and associates it with an application.
     * This helper method creates the necessary Document and DocumentDictionary
     * entities.
     */
    private DocumentDictionary createTestDocument(Application application, User uploadedBy, DocumentType documentType, String fileName) {
        // Create document
        Document document = new Document();
        document.setSha256Id(UUID.randomUUID().toString());
        document.setPath("/test/path/" + fileName);
        document.setMimeType("application/pdf");
        document.setSizeBytes(1024L);
        document.setUploadedBy(uploadedBy);
        document = documentRepository.save(document);

        // Create document dictionary entry
        DocumentDictionary docDict = new DocumentDictionary();
        docDict.setDocument(document);
        docDict.setApplication(application);
        docDict.setDocumentType(documentType);
        docDict.setName(fileName);
        docDict = documentDictionaryRepository.save(docDict);

        return docDict;
    }
}
