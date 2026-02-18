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
import de.tum.cit.aet.utility.testdata.DepartmentTestData;
import de.tum.cit.aet.utility.testdata.DocumentTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.SchoolTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class ApplicantRetentionJobIntegrationTest {

    private static final UUID DELETED_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000100");

    @Autowired
    private ApplicantRetentionJob applicantRetentionJob;

    @Autowired
    private ApplicantRetentionProperties properties;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentDictionaryRepository documentDictionaryRepository;

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
    private EntityManager entityManager;

    private ResearchGroup researchGroup;

    @BeforeEach
    void setUp() {
        properties.setEnabled(true);
        properties.setDryRun(false);
        properties.setDaysBeforeDeletion(1);
        properties.setBatchSize(10);
        properties.setMaxRuntimeMinutes(1);

        School school = SchoolTestData.savedDefault(schoolRepository);
        researchGroup = ResearchGroupTestData.saved(researchGroupRepository, DepartmentTestData.savedDefault(departmentRepository, school));

        ensureDeletedUserExists(); // safe
    }

    private void ensureDeletedUserExists() {
        if (userRepository.existsById(DELETED_USER_ID)) return;

        User deleted = new User();
        deleted.setUserId(DELETED_USER_ID);
        deleted.setEmail("deleted@user");
        deleted.setFirstName("Deleted");
        deleted.setLastName("User");
        deleted.setSelectedLanguage("en");
        deleted.setUniversityId("del" + UUID.randomUUID().toString().replace("-", "").substring(0, 4)); // avoid unique clash
        userRepository.saveAndFlush(deleted);
    }

    @Test
    void shouldRespectDryRunWhenEnabled() {
        Application oldApplication = createApplicationWithLastModified(
            LocalDateTime.now(ZoneOffset.UTC).minusDays(2),
            "old-cv.pdf"
        ).application();

        properties.setDryRun(true);
        applicantRetentionJob.deleteApplicantData();
        assertThat(applicationRepository.existsById(oldApplication.getApplicationId())).isTrue();

        properties.setDryRun(false);
        applicantRetentionJob.deleteApplicantData();
        assertThat(applicationRepository.existsById(oldApplication.getApplicationId())).isFalse();
    }

    @Test
    void shouldOnlyDeleteApplicationsBeforeCutoff() {
        User professor = UserTestData.saveProfessor(researchGroup, userRepository);
        User applicantUser = ApplicantTestData.saveApplicant("applicant-job@test.local", userRepository);
        Applicant applicant = ApplicantTestData.savedWithExistingUser(applicantRepository, applicantUser);
        Job job = createJob(professor);

        ApplicationWithDocs oldApplication = createApplicationWithLastModified(
            professor,
            applicant,
            job,
            LocalDateTime.now(ZoneOffset.UTC).minusDays(3),
            "old-cv.pdf"
        );
        ApplicationWithDocs recentApplication = createApplicationWithLastModified(
            professor,
            applicant,
            job,
            LocalDateTime.now(ZoneOffset.UTC).minusHours(6),
            "recent-cv.pdf"
        );

        applicantRetentionJob.deleteApplicantData();

        assertThat(applicationRepository.existsById(oldApplication.application().getApplicationId())).isFalse();
        assertThat(applicationRepository.existsById(recentApplication.application().getApplicationId())).isTrue();

        assertThat(documentDictionaryRepository.findById(recentApplication.dictionary().getDocumentDictionaryId())).isPresent();
        assertThat(documentRepository.findById(recentApplication.dictionary().getDocument().getDocumentId())).isPresent();
    }

    private Job createJob(User professor) {
        Job job = new Job();
        job.setTitle("Job for applicant retention");
        job.setState(JobState.PUBLISHED);
        job.setSupervisingProfessor(professor);
        job.setResearchGroup(researchGroup);
        return jobRepository.saveAndFlush(job);
    }

    private Application createApplication(Job job, Applicant applicant) {
        Application application = new Application();
        application.setJob(job);
        application.setApplicant(applicant);
        application.setState(ApplicationState.REJECTED);
        return applicationRepository.saveAndFlush(application);
    }

    private DocumentDictionary createDocumentDictionary(User professor, Application application, Applicant applicant, String fileName) {
        return DocumentTestData.savedDictionaryWithMockDocument(
            documentRepository,
            documentDictionaryRepository,
            professor,
            application,
            applicant,
            DocumentType.CV,
            fileName
        );
    }

    private ApplicationWithDocs createApplicationWithLastModified(LocalDateTime lastModifiedAt, String fileName) {
        User professor = UserTestData.saveProfessor(researchGroup, userRepository);
        User applicantUser = ApplicantTestData.saveApplicant("applicant-job@test.local", userRepository);
        Applicant applicant = ApplicantTestData.savedWithExistingUser(applicantRepository, applicantUser);
        Job job = createJob(professor);
        return createApplicationWithLastModified(professor, applicant, job, lastModifiedAt, fileName);
    }

    private ApplicationWithDocs createApplicationWithLastModified(
        User professor,
        Applicant applicant,
        Job job,
        LocalDateTime lastModifiedAt,
        String fileName
    ) {
        Application application = createApplication(job, applicant);
        DocumentDictionary dictionary = createDocumentDictionary(professor, application, applicant, fileName);

        // Update lastModifiedAt in DB to the desired old date
        entityManager
            .createNativeQuery("UPDATE applications SET last_modified_at = :date WHERE application_id = :id")
            .setParameter("date", lastModifiedAt)
            .setParameter("id", application.getApplicationId())
            .executeUpdate();
        entityManager.flush();
        entityManager.clear();

        return new ApplicationWithDocs(application, dictionary);
    }

    private record ApplicationWithDocs(Application application, DocumentDictionary dictionary) {}
}
