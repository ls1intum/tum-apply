package de.tum.cit.aet.core.retention;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import de.tum.cit.aet.IntegrationTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.config.ApplicantRetentionProperties;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
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
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.SchoolTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class ApplicantRetentionWarningIntegrationTest {

    @Autowired
    private ApplicantRetentionJob applicantRetentionJob;

    @Autowired
    private ApplicantRetentionService applicantRetentionService;

    @Autowired
    private ApplicantRetentionProperties properties;

    @Autowired
    private ApplicationRepository applicationRepository;

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

    private AsyncEmailSender mockSender;

    private ResearchGroup researchGroup;

    @BeforeEach
    void setUp() {
        mockSender = Mockito.mock(AsyncEmailSender.class);
        ReflectionTestUtils.setField(applicantRetentionService, "sender", mockSender);

        properties.setDaysBeforeDeletion(90); // give enough headroom for the 28-day warning window

        School school = SchoolTestData.savedDefault(schoolRepository);
        researchGroup = ResearchGroupTestData.saved(researchGroupRepository, DepartmentTestData.savedDefault(departmentRepository, school));
    }

    @Test
    void shouldSendWarningEmailForClosedApplicationsBeforeWarningCutoff() {
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime warningCutoff = nowUtc.minusDays(properties.getDaysBeforeDeletion() - 28);

        User professor = UserTestData.saveProfessor(researchGroup, userRepository);
        User warnedApplicantUser = ApplicantTestData.saveApplicant(
            "warn-" + UUID.randomUUID().toString().substring(0, 8) + "@test.local",
            userRepository
        );
        Applicant warnedApplicant = ApplicantTestData.savedWithExistingUser(applicantRepository, warnedApplicantUser);
        Job job = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Job for applicant retention warnings",
            JobState.PUBLISHED,
            null
        );
        Application oldClosedApplication = createApplication(job, warnedApplicant, ApplicationState.REJECTED);
        setLastModified(oldClosedApplication, warningCutoff.minusDays(1));

        applicantRetentionJob.warnApplicantOfDataDeletion();

        ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);
        verify(mockSender, times(1)).sendAsync(emailCaptor.capture());

        Email sentEmail = emailCaptor.getValue();
        assertThat(sentEmail.getEmailType()).isEqualTo(EmailType.APPLICANT_DATA_DELETION_WARNING);
        assertThat(sentEmail.getTo()).extracting(User::getUserId).contains(warnedApplicantUser.getUserId());
    }

    @Test
    void shouldNotSendWarningsForRecentOrActiveApplications() {
        LocalDateTime nowUtc = LocalDateTime.now(ZoneOffset.UTC);
        LocalDateTime warningCutoff = nowUtc.minusDays(properties.getDaysBeforeDeletion() - 28);

        User professor = UserTestData.saveProfessor(researchGroup, userRepository);
        Job job = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Job for applicant retention warnings",
            JobState.PUBLISHED,
            null
        );

        User recentApplicantUser = ApplicantTestData.saveApplicant(
            "recent-" + UUID.randomUUID().toString().substring(0, 8) + "@test.local",
            userRepository
        );
        Applicant recentApplicant = ApplicantTestData.savedWithExistingUser(applicantRepository, recentApplicantUser);
        Application recentClosedApplication = createApplication(job, recentApplicant, ApplicationState.REJECTED);
        setLastModified(recentClosedApplication, warningCutoff.plusDays(1)); // newer than cutoff

        User activeApplicantUser = ApplicantTestData.saveApplicant(
            "active-" + UUID.randomUUID().toString().substring(0, 8) + "@test.local",
            userRepository
        );
        Applicant activeApplicant = ApplicantTestData.savedWithExistingUser(applicantRepository, activeApplicantUser);
        Application activeApplication = createApplication(job, activeApplicant, ApplicationState.SENT); // not in closed set
        setLastModified(activeApplication, warningCutoff.minusDays(2));

        applicantRetentionJob.warnApplicantOfDataDeletion();

        verify(mockSender, never()).sendAsync(Mockito.any());
    }

    private Application createApplication(Job job, Applicant applicant, ApplicationState state) {
        Application application = new Application();
        application.setJob(job);
        application.setApplicant(applicant);
        application.setState(state);
        return applicationRepository.saveAndFlush(application);
    }

    private void setLastModified(Application application, LocalDateTime lastModifiedAt) {
        entityManager
            .createNativeQuery("UPDATE applications SET last_modified_at = :date WHERE application_id = :id")
            .setParameter("date", lastModifiedAt)
            .setParameter("id", application.getApplicationId())
            .executeUpdate();
        entityManager.flush();
        entityManager.clear();
    }
}
