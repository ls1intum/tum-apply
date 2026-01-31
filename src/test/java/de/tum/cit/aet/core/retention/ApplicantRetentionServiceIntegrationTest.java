package de.tum.cit.aet.core.retention;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.IntegrationTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.DepartmentRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.SchoolRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.ApplicationTestData;
import de.tum.cit.aet.utility.testdata.DepartmentTestData;
import de.tum.cit.aet.utility.testdata.DocumentTestData;
import de.tum.cit.aet.utility.testdata.InternalCommentTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.SchoolTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class ApplicantRetentionServiceIntegrationTest {

    @Autowired
    private ApplicantRetentionService applicantRetentionService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationReviewRepository applicationReviewRepository;

    @Autowired
    private ApplicantRepository applicantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ResearchGroupRepository researchGroupRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentDictionaryRepository documentDictionaryRepository;

    @Autowired
    private InternalCommentRepository internalCommentRepository;

    private ResearchGroup researchGroup;

    @BeforeEach
    void setUp() {
        School school = SchoolTestData.savedDefault(schoolRepository);
        researchGroup = ResearchGroupTestData.saved(researchGroupRepository, DepartmentTestData.savedDefault(departmentRepository, school));
    }

    @Test
    void shouldDeleteApplicationAndAssociatedData() {
        TestFixtures fixtures = createApplicationWithRelations();

        Page<UUID> page = new PageImpl<>(List.of(fixtures.application.getApplicationId()));
        applicantRetentionService.processApplications(page, false, LocalDateTime.now());

        assertThat(applicationRepository.findById(fixtures.application.getApplicationId())).isNotPresent();
        assertThat(applicationReviewRepository.findById(fixtures.review.getApplicationReviewId())).isNotPresent();
        assertThat(internalCommentRepository.findById(fixtures.comment.getInternalCommentId())).isNotPresent();
        assertThat(documentDictionaryRepository.findById(fixtures.dictionary.getDocumentDictionaryId())).isNotPresent();
    }

    @Test
    void shouldNotDeleteAnythingInDryRun() {
        TestFixtures fixtures = createApplicationWithRelations();

        Page<UUID> page = new PageImpl<>(List.of(fixtures.application.getApplicationId()));
        applicantRetentionService.processApplications(page, true, LocalDateTime.now());

        assertThat(applicationRepository.findById(fixtures.application.getApplicationId())).isPresent();
        assertThat(applicationReviewRepository.findById(fixtures.review.getApplicationReviewId())).isPresent();
        assertThat(internalCommentRepository.findById(fixtures.comment.getInternalCommentId())).isPresent();
        assertThat(documentDictionaryRepository.findById(fixtures.dictionary.getDocumentDictionaryId())).isPresent();
    }

    @Test
    void shouldContinueWhenApplicationMissing() {
        TestFixtures fixtures = createApplicationWithRelations();
        UUID missingId = UUID.randomUUID();

        Page<UUID> page = new PageImpl<>(List.of(missingId, fixtures.application.getApplicationId()));
        applicantRetentionService.processApplications(page, false, LocalDateTime.now());

        assertThat(applicationRepository.findById(fixtures.application.getApplicationId())).isNotPresent();
    }

    @Test
    void shouldKeepDocumentsOfOtherApplicationsForSameApplicant() {
        DualApplicationFixtures fixtures = createTwoApplicationsForApplicant();

        Page<UUID> page = new PageImpl<>(List.of(fixtures.oldApplication.getApplicationId()));
        applicantRetentionService.processApplications(page, false, LocalDateTime.now());

        // Old application and its artifacts are gone
        assertThat(applicationRepository.findById(fixtures.oldApplication.getApplicationId())).isNotPresent();
        assertThat(applicationReviewRepository.findById(fixtures.oldReview.getApplicationReviewId())).isNotPresent();
        assertThat(documentDictionaryRepository.findById(fixtures.oldDictionary.getDocumentDictionaryId())).isNotPresent();
        assertThat(documentRepository.findById(fixtures.oldDictionary.getDocument().getDocumentId())).isNotPresent();

        // Newer application and its documents remain untouched
        assertThat(applicationRepository.findById(fixtures.recentApplication.getApplicationId())).isPresent();
        assertThat(documentDictionaryRepository.findById(fixtures.recentDictionary.getDocumentDictionaryId())).isPresent();
        assertThat(documentRepository.findById(fixtures.recentDictionary.getDocument().getDocumentId())).isPresent();
    }

    private TestFixtures createApplicationWithRelations() {
        User professor = UserTestData.savedProfessor(userRepository, researchGroup);
        User applicantUser = ApplicantTestData.saveApplicant("applicant-service-" + UUID.randomUUID() + "@test.local", userRepository);
        Applicant applicant = ApplicantTestData.savedWithExistingUser(applicantRepository, applicantUser);

        Job job = JobTestData.saved(jobRepository, professor, researchGroup, "Retention Job", JobState.PUBLISHED, null);
        Application application = ApplicationTestData.saved(applicationRepository, job, applicant, ApplicationState.REJECTED);

        ApplicationReview review = new ApplicationReview();
        review.setApplication(application);
        review.setReviewedBy(professor);
        review.setReason("Outdated application");
        review = applicationReviewRepository.save(review);

        InternalComment comment = InternalCommentTestData.saved(internalCommentRepository, application, professor);
        DocumentDictionary dictionary = DocumentTestData.savedDictionaryWithMockDocument(
            documentRepository,
            documentDictionaryRepository,
            professor,
            application,
            applicant,
            DocumentType.CV,
            "cv.pdf"
        );

        return new TestFixtures(application, review, comment, dictionary);
    }

    private DualApplicationFixtures createTwoApplicationsForApplicant() {
        User professor = UserTestData.savedProfessor(userRepository, researchGroup);
        User applicantUser = ApplicantTestData.saveApplicant("applicant-service-dual-" + UUID.randomUUID() + "@test.local", userRepository);
        Applicant applicant = ApplicantTestData.savedWithExistingUser(applicantRepository, applicantUser);

        Job job = JobTestData.saved(jobRepository, professor, researchGroup, "Retention Job", JobState.PUBLISHED, null);

        Application oldApplication = ApplicationTestData.saved(applicationRepository, job, applicant, ApplicationState.REJECTED);
        ApplicationReview oldReview = new ApplicationReview();
        oldReview.setApplication(oldApplication);
        oldReview.setReviewedBy(professor);
        oldReview.setReason("Outdated application");
        oldReview = applicationReviewRepository.save(oldReview);
        DocumentDictionary oldDictionary = DocumentTestData.savedDictionaryWithMockDocument(
            documentRepository,
            documentDictionaryRepository,
            professor,
            oldApplication,
            applicant,
            DocumentType.CV,
            "old-cv.pdf"
        );

        Application recentApplication = ApplicationTestData.saved(applicationRepository, job, applicant, ApplicationState.SENT);
        DocumentDictionary recentDictionary = DocumentTestData.savedDictionaryWithMockDocument(
            documentRepository,
            documentDictionaryRepository,
            professor,
            recentApplication,
            applicant,
            DocumentType.CV,
            "recent-cv.pdf"
        );

        return new DualApplicationFixtures(oldApplication, oldReview, oldDictionary, recentApplication, recentDictionary);
    }

    private record TestFixtures(
        Application application,
        ApplicationReview review,
        InternalComment comment,
        DocumentDictionary dictionary
    ) {}

    private record DualApplicationFixtures(
        Application oldApplication,
        ApplicationReview oldReview,
        DocumentDictionary oldDictionary,
        Application recentApplication,
        DocumentDictionary recentDictionary
    ) {}
}
