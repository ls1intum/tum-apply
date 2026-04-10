package de.tum.cit.aet.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.ai.dto.ExtractedApplicationDataDTO;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import de.tum.cit.aet.application.domain.dto.UpdateApplicationDTO;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.DocumentService;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import de.tum.cit.aet.usermanagement.dto.UserDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.DepartmentTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.SchoolTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.util.HashSet;
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
class ApplicationServiceTest {

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final UUID TEST_JOB_ID = UUID.randomUUID();
    private static final UUID TEST_APPLICATION_ID = UUID.randomUUID();

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentService documentService;

    @Mock
    private DocumentDictionaryService documentDictionaryService;

    @Mock
    private ApplicantService applicantService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private AsyncEmailSender sender;

    @InjectMocks
    private ApplicationService applicationService;

    private User applicantUser;
    private Applicant applicant;
    private User professor;
    private ResearchGroup researchGroup;
    private Job job;
    private Application application;

    @BeforeEach
    void setUp() {
        School school = SchoolTestData.newSchoolAll("School of Computation, Information and Technology", "CIT");
        Department department = DepartmentTestData.newDepartmentAll("Computer Science", school);
        researchGroup = ResearchGroupTestData.newRgWithDepartment(department);

        professor = UserTestData.newProfessor(researchGroup);
        professor.setSelectedLanguage("en");

        applicantUser = UserTestData.newUserAll(TEST_USER_ID, "ada@example.com", "Ada", "Lovelace");
        applicantUser.setSelectedLanguage("en");
        applicantUser.setGender("Female");
        applicantUser.setNationality("British");
        applicantUser.setBirthday(LocalDate.of(1990, 12, 10));
        applicantUser.setPhoneNumber("+49123456789");
        applicantUser.setWebsite("https://original.example.com");
        applicantUser.setLinkedinUrl("https://linkedin.com/in/original");

        applicant = ApplicantTestData.newApplicant(applicantUser);

        job = JobTestData.newJob(professor, researchGroup, "AI Engineer Position", JobState.PUBLISHED, LocalDate.of(2025, 9, 1));
        job.setJobId(TEST_JOB_ID);

        application = new Application();
        application.setApplicationId(TEST_APPLICATION_ID);
        application.setApplicant(applicant);
        application.setJob(job);
        application.setState(ApplicationState.SAVED);
        application.setCustomFieldAnswers(new HashSet<>());
        application.setInternalComments(new HashSet<>());
    }

    @Nested
    class CreateApplication {

        @Test
        void shouldCreateApplicationFromApplicantSnapshotWithoutMutatingApplicant() {
            when(jobRepository.findById(TEST_JOB_ID)).thenReturn(Optional.of(job));
            when(currentUserService.getUserId()).thenReturn(TEST_USER_ID);
            when(applicationRepository.getByApplicantByUserIdAndJobId(TEST_USER_ID, TEST_JOB_ID)).thenReturn(null);
            when(applicantService.findOrCreateApplicant(TEST_USER_ID)).thenReturn(applicant);
            when(documentDictionaryService.getApplicantDocumentDictionaries(eq(applicant), any(DocumentType.class))).thenReturn(Set.of());
            when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> {
                Application saved = invocation.getArgument(0);
                saved.setApplicationId(TEST_APPLICATION_ID);
                return saved;
            });

            ApplicationForApplicantDTO result = applicationService.createApplication(TEST_JOB_ID);

            ArgumentCaptor<Application> captor = ArgumentCaptor.forClass(Application.class);
            verify(applicationRepository).save(captor.capture());
            Application savedApplication = captor.getValue();

            assertThat(savedApplication.getApplicant()).isEqualTo(applicant);
            assertThat(savedApplication.getState()).isEqualTo(ApplicationState.SAVED);
            assertThat(savedApplication.getApplicantFirstName()).isEqualTo("Ada");
            assertThat(savedApplication.getApplicantLastName()).isEqualTo("Lovelace");
            assertThat(savedApplication.getApplicantEmail()).isEqualTo("ada@example.com");
            assertThat(savedApplication.getApplicantStreet()).isEqualTo("Teststr. 1");
            assertThat(savedApplication.getApplicantBachelorDegreeName()).isEqualTo("B.Sc. Computer Science");
            assertThat(savedApplication.getApplicantMasterDegreeName()).isEqualTo("M.Sc. Informatics");

            assertThat(applicant.getStreet()).isEqualTo("Teststr. 1");
            assertThat(applicant.getBachelorDegreeName()).isEqualTo("B.Sc. Computer Science");
            assertThat(applicantUser.getEmail()).isEqualTo("ada@example.com");

            assertThat(result.applicationId()).isEqualTo(TEST_APPLICATION_ID);
            assertThat(result.applicant().user().email()).isEqualTo("ada@example.com");
            verify(documentDictionaryService, times(5)).getApplicantDocumentDictionaries(eq(applicant), any(DocumentType.class));
        }
    }

    @Nested
    class UpdateApplication {

        @Test
        void shouldUpdateOnlyApplicationSnapshotWhenStateRemainsSaved() {
            when(applicationRepository.findById(TEST_APPLICATION_ID)).thenReturn(Optional.of(application));
            when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

            UpdateApplicationDTO update = new UpdateApplicationDTO(
                TEST_APPLICATION_ID,
                applicantDto(
                    "updated.snapshot@example.com",
                    "Grace",
                    "Hopper",
                    "Updated Street",
                    "80333",
                    "Munich",
                    "Germany",
                    "Updated Bachelor Degree",
                    "1.2",
                    "Updated Master Degree",
                    "1.1"
                ),
                LocalDate.of(2025, 11, 15),
                ApplicationState.SAVED,
                "Updated projects",
                "Updated skills",
                "Updated motivation"
            );

            ApplicationForApplicantDTO result = applicationService.updateApplication(update);

            assertThat(application.getApplicantEmail()).isEqualTo("updated.snapshot@example.com");
            assertThat(application.getApplicantFirstName()).isEqualTo("Grace");
            assertThat(application.getApplicantLastName()).isEqualTo("Hopper");
            assertThat(application.getApplicantStreet()).isEqualTo("Updated Street");
            assertThat(application.getApplicantBachelorDegreeName()).isEqualTo("Updated Bachelor Degree");
            assertThat(application.getApplicantMasterGrade()).isEqualTo("1.1");
            assertThat(application.getAppliedAt()).isNull();

            assertThat(applicantUser.getEmail()).isEqualTo("ada@example.com");
            assertThat(applicant.getStreet()).isEqualTo("Teststr. 1");
            assertThat(applicant.getBachelorDegreeName()).isEqualTo("B.Sc. Computer Science");
            assertThat(applicant.getMasterGrade()).isEqualTo("1.3");

            assertThat(result.applicant().user().email()).isEqualTo("updated.snapshot@example.com");
            assertThat(result.applicationState()).isEqualTo(ApplicationState.SAVED);
            verify(applicantService, never()).applyApplicationInformationData(
                any(User.class),
                any(Applicant.class),
                any(ApplicantDTO.class)
            );
            verify(applicantService, never()).applyDocumentSettingsData(any(Applicant.class), any(ApplicantDTO.class));
            verify(sender, never()).sendAsync(any());
        }

        @Test
        void shouldSanitizeHtmlInRichTextFields() {
            when(applicationRepository.findById(TEST_APPLICATION_ID)).thenReturn(Optional.of(application));
            when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

            String xssMotivation = "<p>My motivation</p><script>alert('xss')</script>";
            String xssSkills = "<b>Java</b><img src=x onerror=alert(1)>";
            String xssProjects = "<p>Project</p><iframe src='evil.com'></iframe>";

            UpdateApplicationDTO update = new UpdateApplicationDTO(
                TEST_APPLICATION_ID,
                applicantDto("ada@example.com", "Ada", "Lovelace", "Street", "80333", "Munich", "Germany", "B.Sc.", "1.0", "M.Sc.", "1.0"),
                LocalDate.of(2025, 11, 15),
                ApplicationState.SAVED,
                xssProjects,
                xssSkills,
                xssMotivation
            );

            ApplicationForApplicantDTO result = applicationService.updateApplication(update);

            // Verify the entity was sanitized on write
            assertThat(application.getMotivation()).contains("My motivation");
            assertThat(application.getMotivation()).doesNotContain("<script");
            assertThat(application.getMotivation()).doesNotContain("alert");
            assertThat(application.getSpecialSkills()).contains("<b>Java</b>");
            assertThat(application.getSpecialSkills()).doesNotContain("onerror");
            assertThat(application.getSpecialSkills()).doesNotContain("<img");
            assertThat(application.getProjects()).contains("Project");
            assertThat(application.getProjects()).doesNotContain("<iframe");

            // Verify the DTO returned to the client is also sanitized on read
            assertThat(result.projects()).doesNotContain("<iframe");
            assertThat(result.specialSkills()).doesNotContain("onerror");
            assertThat(result.motivation()).doesNotContain("<script");

            // Verify safe formatting tags are preserved
            assertThat(application.getMotivation()).contains("<p>");
            assertThat(application.getSpecialSkills()).contains("<b>");
            assertThat(application.getProjects()).contains("<p>");

            // Verify non-rich-text fields were not affected
            assertThat(application.getApplicantEmail()).isEqualTo("ada@example.com");
            assertThat(application.getState()).isEqualTo(ApplicationState.SAVED);
        }

        @Test
        void shouldSyncSnapshotBackToApplicantWhenStateChangesToSent() {
            when(applicationRepository.findById(TEST_APPLICATION_ID)).thenReturn(Optional.of(application));
            when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(documentDictionaryService.getApplicationDocumentDictionaries(eq(application), any(DocumentType.class))).thenReturn(
                Set.of()
            );
            when(documentDictionaryService.getApplicantDocumentDictionaries(eq(applicant), any(DocumentType.class))).thenReturn(Set.of());

            UpdateApplicationDTO update = new UpdateApplicationDTO(
                TEST_APPLICATION_ID,
                applicantDto(
                    "synced@example.com",
                    "Katherine",
                    "Johnson",
                    "Sync Street",
                    "80539",
                    "Munich",
                    "Germany",
                    "Synced Bachelor Degree",
                    "1.0",
                    "Synced Master Degree",
                    "1.1"
                ),
                LocalDate.of(2025, 12, 1),
                ApplicationState.SENT,
                "Projects",
                "Skills",
                "Motivation"
            );

            applicationService.updateApplication(update);

            ArgumentCaptor<ApplicantDTO> personalCaptor = ArgumentCaptor.forClass(ApplicantDTO.class);
            ArgumentCaptor<ApplicantDTO> documentCaptor = ArgumentCaptor.forClass(ApplicantDTO.class);

            verify(applicantService).applyApplicationInformationData(eq(applicantUser), eq(applicant), personalCaptor.capture());
            verify(applicantService).applyDocumentSettingsData(eq(applicant), documentCaptor.capture());
            verify(sender, times(2)).sendAsync(any());

            ApplicantDTO personalDto = personalCaptor.getValue();
            ApplicantDTO documentDto = documentCaptor.getValue();

            assertThat(application.getApplicantEmail()).isEqualTo("synced@example.com");
            assertThat(application.getApplicantFirstName()).isEqualTo("Katherine");
            assertThat(application.getApplicantStreet()).isEqualTo("Sync Street");
            assertThat(application.getApplicantBachelorDegreeName()).isEqualTo("Synced Bachelor Degree");
            assertThat(application.getAppliedAt()).isNotNull();

            assertThat(personalDto.user().email()).isEqualTo("synced@example.com");
            assertThat(personalDto.user().firstName()).isEqualTo("Katherine");
            assertThat(personalDto.street()).isEqualTo("Sync Street");
            assertThat(documentDto.bachelorDegreeName()).isEqualTo("Synced Bachelor Degree");
            assertThat(documentDto.masterDegreeName()).isEqualTo("Synced Master Degree");

            verify(documentDictionaryService, times(5)).getApplicationDocumentDictionaries(eq(application), any(DocumentType.class));
            verify(documentDictionaryService, times(5)).getApplicantDocumentDictionaries(eq(applicant), any(DocumentType.class));
        }
    }

    @Nested
    class ApplyExtractedPdfData {

        @Test
        void shouldFillExtractedFields() {
            when(applicationRepository.findById(TEST_APPLICATION_ID)).thenReturn(Optional.of(application));
            when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ExtractedApplicationDataDTO extracted = new ExtractedApplicationDataDTO(
                "Ada",
                "Lovelace",
                null,
                null,
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
            applicationService.applyExtractedPdfData(TEST_APPLICATION_ID.toString(), extracted);

            assertThat(application.getApplicantFirstName()).isEqualTo("Ada");
            assertThat(application.getApplicantLastName()).isEqualTo("Lovelace");
        }

        @Test
        void shouldOnlyFillEmptyFields() {
            application.setApplicantFirstName("Existing");
            when(applicationRepository.findById(TEST_APPLICATION_ID)).thenReturn(Optional.of(application));
            when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ExtractedApplicationDataDTO extracted = new ExtractedApplicationDataDTO(
                "Overwrite",
                "New",
                null,
                null,
                null,
                "New Street",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            );
            applicationService.applyExtractedPdfData(TEST_APPLICATION_ID.toString(), extracted);

            // Existing field should not be overwritten
            assertThat(application.getApplicantFirstName()).isEqualTo("Existing");
            // Empty fields should be filled
            assertThat(application.getApplicantLastName()).isEqualTo("New");
            assertThat(application.getApplicantStreet()).isEqualTo("New Street");
        }
    }

    private ApplicantDTO applicantDto(
        String email,
        String firstName,
        String lastName,
        String street,
        String postalCode,
        String city,
        String country,
        String bachelorDegreeName,
        String bachelorGrade,
        String masterDegreeName,
        String masterGrade
    ) {
        return new ApplicantDTO(
            new UserDTO(
                TEST_USER_ID,
                email,
                null,
                firstName,
                lastName,
                "Other",
                "German",
                LocalDate.of(1992, 2, 2),
                "+49111111111",
                "https://updated.example.com",
                "https://linkedin.com/in/updated",
                "en",
                null
            ),
            street,
            postalCode,
            city,
            country,
            bachelorDegreeName,
            "1.0",
            "5.0",
            bachelorGrade,
            "Updated Bachelor University",
            masterDegreeName,
            "1.0",
            "5.0",
            masterGrade,
            "Updated Master University"
        );
    }
}
