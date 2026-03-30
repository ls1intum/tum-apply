package de.tum.cit.aet.job.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.ImageService;
import de.tum.cit.aet.interview.service.InterviewService;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.dto.JobPublicationEmailContext;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.EmailSettingService;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.DepartmentTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.SchoolTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicantRepository applicantRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private AsyncEmailSender sender;

    @Mock
    private EmailSettingService emailSettingService;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private InterviewService interviewService;

    @Mock
    private JobImageHelper jobImageHelper;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private JobService jobService;

    private User applicantUser;
    private Applicant applicant;
    private Job draftJob;

    @BeforeEach
    void setUp() {
        School school = SchoolTestData.newSchoolAll("School of Computation, Information and Technology", "CIT");
        Department department = DepartmentTestData.newDepartmentAll("Computer Science", school);
        ResearchGroup researchGroup = ResearchGroupTestData.newRgWithDepartment(department);

        User professor = UserTestData.newProfessor(researchGroup);
        professor.setUserId(UUID.randomUUID());
        professor.setSelectedLanguage(Language.ENGLISH.getCode());

        applicantUser = UserTestData.newUserAll(UUID.randomUUID(), "ada@example.com", "Ada", "Lovelace");
        applicantUser.setSelectedLanguage(Language.GERMAN.getCode());
        applicant = ApplicantTestData.newApplicant(applicantUser);

        draftJob = JobTestData.newJob(professor, researchGroup, "AI Engineer Position", JobState.DRAFT, LocalDate.of(2025, 9, 1));
        draftJob.setJobId(UUID.randomUUID());
    }

    @Nested
    class ChangeJobState {

        @Test
        void shouldNotifyMatchingApplicantsWhenJobTransitionsToPublished() {
            when(jobRepository.findById(draftJob.getJobId())).thenReturn(Optional.of(draftJob));
            when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(applicantRepository.findAllBySubjectAreaSubscription(draftJob.getSubjectArea())).thenReturn(Set.of(applicant));
            when(emailSettingService.canNotify(EmailType.JOB_PUBLISHED_SUBJECT_AREA, applicantUser)).thenReturn(true);

            JobFormDTO result = jobService.changeJobState(draftJob.getJobId(), JobState.PUBLISHED, false);

            ArgumentCaptor<Email> emailCaptor = ArgumentCaptor.forClass(Email.class);
            verify(sender).sendAsync(emailCaptor.capture());

            Email sentEmail = emailCaptor.getValue();
            assertThat(result.state()).isEqualTo(JobState.PUBLISHED);
            assertThat(sentEmail.getEmailType()).isEqualTo(EmailType.JOB_PUBLISHED_SUBJECT_AREA);
            assertThat(sentEmail.getLanguage()).isEqualTo(Language.GERMAN);
            assertThat(sentEmail.getContent()).isInstanceOf(JobPublicationEmailContext.class);
            JobPublicationEmailContext context = (JobPublicationEmailContext) sentEmail.getContent();
            assertThat(context.job()).isEqualTo(draftJob);
            assertThat(context.user()).isEqualTo(applicantUser);
            assertThat(sentEmail.isSendAlways()).isTrue();
            assertThat(sentEmail.getTo()).containsExactly(applicantUser);
        }

        @Test
        void shouldNotNotifyApplicantsWhenSubjectAreaNotificationSettingIsDisabled() {
            when(jobRepository.findById(draftJob.getJobId())).thenReturn(Optional.of(draftJob));
            when(jobRepository.save(any(Job.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(applicantRepository.findAllBySubjectAreaSubscription(draftJob.getSubjectArea())).thenReturn(Set.of(applicant));
            when(emailSettingService.canNotify(EmailType.JOB_PUBLISHED_SUBJECT_AREA, applicantUser)).thenReturn(false);

            JobFormDTO result = jobService.changeJobState(draftJob.getJobId(), JobState.PUBLISHED, false);

            assertThat(result.state()).isEqualTo(JobState.PUBLISHED);
            verify(sender, never()).sendAsync(any());
            verify(interviewService, never()).createInterviewProcessForJob(any());
        }
    }
}
