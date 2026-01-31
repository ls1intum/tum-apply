package de.tum.cit.aet.core.retention;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.IntegrationTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.config.ApplicantRetentionProperties;
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
import de.tum.cit.aet.utility.testdata.ApplicationTestData;
import de.tum.cit.aet.utility.testdata.DepartmentTestData;
import de.tum.cit.aet.utility.testdata.DocumentTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.SchoolTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.AuditorAware;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class ApplicantRetentionJobIntegrationTest {

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
        ApplicationWithDocs oldApplication = createApplicationWithLastModified(
            LocalDateTime.now(ZoneOffset.UTC).minusDays(3),
            "old-cv.pdf"
        );
        ApplicationWithDocs recentApplication = createApplicationWithLastModified(
            LocalDateTime.now(ZoneOffset.UTC).minusHours(6),
            "recent-cv.pdf"
        );

        applicantRetentionJob.deleteApplicantData();

        assertThat(applicationRepository.existsById(oldApplication.application().getApplicationId())).isFalse();
        assertThat(applicationRepository.existsById(recentApplication.application().getApplicationId())).isTrue();

        // Documents/dictionaries of the recent application must remain
        assertThat(documentDictionaryRepository.findById(recentApplication.dictionary().getDocumentDictionaryId())).isPresent();
        assertThat(documentRepository.findById(recentApplication.dictionary().getDocument().getDocumentId())).isPresent();
    }

    private ApplicationWithDocs createApplicationWithLastModified(LocalDateTime lastModifiedAt, String fileName) {
        User professor = UserTestData.savedProfessor(userRepository, researchGroup);
        User applicantUser = ApplicantTestData.saveApplicant("applicant-job-" + UUID.randomUUID() + "@test.local", userRepository);
        Applicant applicant = ApplicantTestData.savedWithExistingUser(applicantRepository, applicantUser);
        Job job = JobTestData.saved(jobRepository, professor, researchGroup, "Job for applicant retention", JobState.PUBLISHED, null);
        Application application = ApplicationTestData.saved(applicationRepository, job, applicant, ApplicationState.REJECTED);

        DocumentDictionary dictionary = DocumentTestData.savedDictionaryWithMockDocument(
            documentRepository,
            documentDictionaryRepository,
            professor,
            application,
            applicant,
            DocumentType.CV,
            fileName
        );

        ReflectionTestUtils.setField(application, "lastModifiedAt", lastModifiedAt);
        application = applicationRepository.saveAndFlush(application);

        return new ApplicationWithDocs(application, dictionary);
    }

    private record ApplicationWithDocs(Application application, DocumentDictionary dictionary) {}
}
