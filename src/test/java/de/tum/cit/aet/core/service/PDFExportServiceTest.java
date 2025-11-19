package de.tum.cit.aet.core.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.dto.JobDetailDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.ApplicantForApplicationDetailDTO;
import de.tum.cit.aet.usermanagement.dto.UserForApplicationDetailDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.time.LocalDate;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;

@ExtendWith(MockitoExtension.class)
class PDFExportServiceTest {

    @Mock
    private ApplicationService applicationService;

    @Mock
    private JobService jobService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PDFExportService pdfExportService;

    private static final UUID TEST_APPLICATION_ID = UUID.randomUUID();
    private static final UUID TEST_JOB_ID = UUID.randomUUID();
    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final UUID TEST_RESEARCH_GROUP_ID = UUID.randomUUID();

    private ResearchGroup testResearchGroup;
    private User testUser;
    private Map<String, String> testLabels;

    @BeforeEach
    void setUp() {
        // Initialize test user
        testUser = UserTestData.newUserAll(TEST_USER_ID, "test@example.com", "John", "Doe");

        // Initialize test research group
        testResearchGroup = ResearchGroupTestData.newRgAll(
            "Prof. Test",
            "Test Research Group",
            "TRG",
            "Munich",
            "Computer Science",
            "Test description",
            "test@research.com",
            "80333",
            "TUM",
            "Arcisstraße 21",
            "https://test.com",
            "ACTIVE"
        );
        testResearchGroup.setResearchGroupId(TEST_RESEARCH_GROUP_ID);

        // Initialize test labels
        testLabels = createTestLabels();
    }

    // Helper method to create a complete JobDetailDTO mock using lenient() stubbing
    // - allows tests to use only the methods they need without stubbing errors
    private JobDetailDTO createJobDetailDTO() {
        JobDetailDTO jobDetail = mock(JobDetailDTO.class);
        lenient().when(jobDetail.title()).thenReturn("Test Job Title");
        lenient().when(jobDetail.supervisingProfessorName()).thenReturn("Prof. Test");
        lenient().when(jobDetail.location()).thenReturn("Munich");
        lenient().when(jobDetail.fieldOfStudies()).thenReturn("Computer Science");
        lenient().when(jobDetail.researchArea()).thenReturn("AI Research");
        lenient().when(jobDetail.workload()).thenReturn(20);
        lenient().when(jobDetail.contractDuration()).thenReturn(2);
        lenient().when(jobDetail.fundingType()).thenReturn("University Funding");
        lenient().when(jobDetail.startDate()).thenReturn(LocalDate.of(2024, 1, 1));
        lenient().when(jobDetail.endDate()).thenReturn(LocalDate.of(2026, 1, 1));
        lenient().when(jobDetail.description()).thenReturn("Job description");
        lenient().when(jobDetail.tasks()).thenReturn("Job tasks");
        lenient().when(jobDetail.requirements()).thenReturn("Job requirements");
        lenient().when(jobDetail.state()).thenReturn(JobState.DRAFT);
        lenient().when(jobDetail.researchGroup()).thenReturn(testResearchGroup);
        return jobDetail;
    }

    // Helper method to create a complete ApplicationDetailDTO mock using lenient()
    // stubbing - allows tests to use only the methods they need without stubbing
    // errors
    private ApplicationDetailDTO createApplicationDetailDTO() {
        ApplicationDetailDTO applicationDetail = mock(ApplicationDetailDTO.class);
        lenient().when(applicationDetail.jobId()).thenReturn(TEST_JOB_ID);
        lenient().when(applicationDetail.jobTitle()).thenReturn("Test Job Title");
        lenient().when(applicationDetail.applicationState()).thenReturn(ApplicationState.SENT);
        lenient().when(applicationDetail.supervisingProfessorName()).thenReturn("Prof. Test");
        lenient().when(applicationDetail.researchGroup()).thenReturn("Test Research Group");
        lenient().when(applicationDetail.jobLocation()).thenReturn("Munich");
        lenient().when(applicationDetail.motivation()).thenReturn("My motivation");
        lenient().when(applicationDetail.specialSkills()).thenReturn("My skills");
        lenient().when(applicationDetail.projects()).thenReturn("My projects");
        lenient().when(applicationDetail.desiredDate()).thenReturn(LocalDate.of(2024, 2, 1));

        // Setup nested applicant mock
        var applicantMock = mock(ApplicantForApplicationDetailDTO.class);
        var userMock = mock(UserForApplicationDetailDTO.class);
        lenient().when(userMock.preferredLanguage()).thenReturn("English");
        lenient().when(userMock.gender()).thenReturn("Male");
        lenient().when(userMock.nationality()).thenReturn("German");
        lenient().when(userMock.website()).thenReturn("https://example.com");
        lenient().when(userMock.linkedinUrl()).thenReturn("https://linkedin.com/in/test");
        lenient().when(applicantMock.user()).thenReturn(userMock);
        lenient().when(applicantMock.bachelorDegreeName()).thenReturn("B.Sc. Computer Science");
        lenient().when(applicantMock.bachelorUniversity()).thenReturn("TUM");
        lenient().when(applicantMock.bachelorGrade()).thenReturn("1.5");
        lenient().when(applicantMock.masterDegreeName()).thenReturn("M.Sc. Computer Science");
        lenient().when(applicantMock.masterUniversity()).thenReturn("TUM");
        lenient().when(applicantMock.masterGrade()).thenReturn("1.3");
        lenient().when(applicationDetail.applicant()).thenReturn(applicantMock);

        return applicationDetail;
    }

    // Helper method to create a complete JobFormDTO mock using lenient() stubbing
    // - allows tests to use only the methods they need without stubbing errors
    private JobFormDTO createJobFormDTO() {
        JobFormDTO jobFormDTO = mock(JobFormDTO.class);
        FundingType fundingType = mock(FundingType.class);

        lenient().when(jobFormDTO.title()).thenReturn("Test Job Form Title");
        lenient().when(jobFormDTO.supervisingProfessor()).thenReturn(TEST_USER_ID);
        lenient().when(jobFormDTO.state()).thenReturn(JobState.DRAFT);
        lenient().when(jobFormDTO.location()).thenReturn(Campus.MUNICH);
        lenient().when(jobFormDTO.fieldOfStudies()).thenReturn("Computer Science");
        lenient().when(jobFormDTO.researchArea()).thenReturn("AI Research");
        lenient().when(jobFormDTO.workload()).thenReturn(20);
        lenient().when(jobFormDTO.contractDuration()).thenReturn(2);
        lenient().when(jobFormDTO.fundingType()).thenReturn(fundingType);
        lenient().when(fundingType.name()).thenReturn("UNIVERSITY");
        lenient().when(jobFormDTO.startDate()).thenReturn(LocalDate.of(2024, 1, 1));
        lenient().when(jobFormDTO.endDate()).thenReturn(LocalDate.of(2026, 1, 1));
        lenient().when(jobFormDTO.description()).thenReturn("Job description");
        lenient().when(jobFormDTO.tasks()).thenReturn("Job tasks");
        lenient().when(jobFormDTO.requirements()).thenReturn("Job requirements");

        return jobFormDTO;
    }

    private Map<String, String> createTestLabels() {
        Map<String, String> labels = new java.util.HashMap<>();
        addApplicationHeaderLabels(labels);
        addOverviewLabels(labels);
        addPersonalAndEducationLabels(labels);
        addMetadataAndJobLabels(labels);
        return labels;
    }

    private void addApplicationHeaderLabels(Map<String, String> labels) {
        labels.put("headline", "Application for ");
        labels.put("applicationBy", "Application by ");
        labels.put("forPosition", " for position ");
        labels.put("status", "Status: ");
    }

    private void addOverviewLabels(Map<String, String> labels) {
        labels.put("overview", "Overview");
        labels.put("supervisor", "Supervisor");
        labels.put("researchGroup", "Research Group");
        labels.put("location", "Location");
        labels.put("fieldsOfStudies", "Fields of Studies");
        labels.put("researchArea", "Research Area");
        labels.put("workload", "Workload");
        labels.put("hoursPerWeek", " hours/week");
        labels.put("duration", "Duration");
        labels.put("years", " years");
        labels.put("fundingType", "Funding Type");
        labels.put("startDate", "Start Date");
        labels.put("endDate", "End Date");
        labels.put("jobDescription", "Job Description");
    }

    private void addPersonalAndEducationLabels(Map<String, String> labels) {
        labels.put("personalStatements", "Personal Statements");
        labels.put("motivation", "Motivation");
        labels.put("skills", "Skills");
        labels.put("researchExperience", "Research Experience");
        labels.put("personalInformation", "Personal Information");
        labels.put("applicantInfo", "Applicant Info");
        labels.put("preferredLanguage", "Preferred Language");
        labels.put("desiredStartDate", "Desired Start Date");
        labels.put("gender", "Gender");
        labels.put("nationality", "Nationality");
        labels.put("website", "Website");
        labels.put("linkedIn", "LinkedIn");
        labels.put("bachelorInfo", "Bachelor Info");
        labels.put("masterInfo", "Master Info");
        labels.put("degreeName", "Degree Name");
        labels.put("university", "University");
        labels.put("grade", "Grade");
    }

    private void addMetadataAndJobLabels(Map<String, String> labels) {
        labels.put("page", "Page ");
        labels.put("of", " of ");
        labels.put("thisDocumentWasGeneratedOn", "This document was generated on ");
        labels.put("byUser", " by user ");
        labels.put("usingTumapply", " using TUMapply.");
        labels.put("metaEndText", "End of document");
        labels.put("jobBy", "Job by ");
        labels.put("forJob", " for job ");
        labels.put("jobDetails", "Job Details");
        labels.put("description", "Description");
        labels.put("tasksResponsibilities", "Tasks & Responsibilities");
        labels.put("eligibilityCriteria", "Eligibility Criteria");
        labels.put("contactDetails", "Contact Details");
        labels.put("address", "Address");
        labels.put("email", "Email");
    }

    @Nested
    class ExportApplicationToPDF {

        @Test
        void shouldExportApplicationToPDFSuccessfully() {
            ApplicationDetailDTO applicationDetail = createApplicationDetailDTO();
            JobDetailDTO jobDetail = createJobDetailDTO();

            when(applicationService.getApplicationDetail(TEST_APPLICATION_ID)).thenReturn(applicationDetail);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.getCurrentUserFullName()).thenReturn("John Doe");

            Resource result = pdfExportService.exportApplicationToPDF(TEST_APPLICATION_ID, testLabels);

            assertThat(result).isNotNull();
            verify(applicationService).getApplicationDetail(TEST_APPLICATION_ID);
            verify(jobService).getJobDetails(TEST_JOB_ID);
            verify(currentUserService).getCurrentUserFullName();
        }

        @Test
        void shouldHandleNullOptionalValues() {
            ApplicationDetailDTO applicationDetail = mock(ApplicationDetailDTO.class);
            JobDetailDTO jobDetail = createJobDetailDTO();

            var applicantMock = mock(ApplicantForApplicationDetailDTO.class);
            var userMock = mock(UserForApplicationDetailDTO.class);

            when(userMock.preferredLanguage()).thenReturn("English");
            when(userMock.gender()).thenReturn("Male");
            when(userMock.nationality()).thenReturn("German");
            when(userMock.website()).thenReturn(null);
            when(userMock.linkedinUrl()).thenReturn(null);

            when(applicantMock.user()).thenReturn(userMock);
            when(applicantMock.bachelorDegreeName()).thenReturn("B.Sc. CS");
            when(applicantMock.bachelorUniversity()).thenReturn("TUM");
            when(applicantMock.bachelorGrade()).thenReturn("1.5");
            when(applicantMock.masterDegreeName()).thenReturn(null);

            when(applicationDetail.jobId()).thenReturn(TEST_JOB_ID);
            when(applicationDetail.jobTitle()).thenReturn("Test Job Title");
            when(applicationDetail.applicationState()).thenReturn(ApplicationState.SENT);
            when(applicationDetail.supervisingProfessorName()).thenReturn("Prof. Test");
            when(applicationDetail.researchGroup()).thenReturn("Test Research Group");
            when(applicationDetail.jobLocation()).thenReturn("Munich");
            when(applicationDetail.motivation()).thenReturn("My motivation");
            when(applicationDetail.specialSkills()).thenReturn("My skills");
            when(applicationDetail.projects()).thenReturn("My projects");
            when(applicationDetail.desiredDate()).thenReturn(LocalDate.of(2024, 2, 1));
            when(applicationDetail.applicant()).thenReturn(applicantMock);

            when(applicationService.getApplicationDetail(TEST_APPLICATION_ID)).thenReturn(applicationDetail);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.getCurrentUserFullName()).thenReturn("John Doe");

            Resource result = pdfExportService.exportApplicationToPDF(TEST_APPLICATION_ID, testLabels);

            assertThat(result).isNotNull();
            verify(applicationService).getApplicationDetail(TEST_APPLICATION_ID);
        }

        @Test
        void shouldHandleEmptyStrings() {
            ApplicationDetailDTO applicationDetail = createApplicationDetailDTO();
            JobDetailDTO jobDetail = createJobDetailDTO();

            when(applicationDetail.motivation()).thenReturn("");
            when(applicationDetail.specialSkills()).thenReturn("");
            when(applicationDetail.projects()).thenReturn("");

            when(applicationService.getApplicationDetail(TEST_APPLICATION_ID)).thenReturn(applicationDetail);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.getCurrentUserFullName()).thenReturn("John Doe");

            Resource result = pdfExportService.exportApplicationToPDF(TEST_APPLICATION_ID, testLabels);

            assertThat(result).isNotNull();
        }
    }

    @Nested
    class ExportJobToPDF {

        @Test
        void shouldExportJobToPDFSuccessfully() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.isProfessor()).thenReturn(true);

            Resource result = pdfExportService.exportJobToPDF(TEST_JOB_ID, testLabels);

            assertThat(result).isNotNull();
            verify(jobService).getJobDetails(TEST_JOB_ID);
            verify(currentUserService).isProfessor();
        }

        @Test
        void shouldHandleNonProfessorUser() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.isProfessor()).thenThrow(new AccessDeniedException("Not a professor"));

            Resource result = pdfExportService.exportJobToPDF(TEST_JOB_ID, testLabels);

            assertThat(result).isNotNull();
            verify(jobService).getJobDetails(TEST_JOB_ID);
        }

        @Test
        void shouldHandleNullJobFields() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            when(jobDetail.workload()).thenReturn(null);
            when(jobDetail.contractDuration()).thenReturn(null);
            when(jobDetail.fundingType()).thenReturn(null);
            when(jobDetail.startDate()).thenReturn(null);
            when(jobDetail.endDate()).thenReturn(null);

            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.isProfessor()).thenReturn(false);

            Resource result = pdfExportService.exportJobToPDF(TEST_JOB_ID, testLabels);

            assertThat(result).isNotNull();
        }
    }

    @Nested
    class ExportJobPreviewToPDF {

        @Test
        void shouldExportJobPreviewToPDFSuccessfully() {
            JobFormDTO jobFormDTO = createJobFormDTO();
            when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
            when(currentUserService.getResearchGroupIfProfessor()).thenReturn(testResearchGroup);

            Resource result = pdfExportService.exportJobPreviewToPDF(jobFormDTO, testLabels);

            assertThat(result).isNotNull();
            verify(userRepository).findById(TEST_USER_ID);
            verify(currentUserService).getResearchGroupIfProfessor();
        }

        @Test
        void shouldHandleUserNotFound() {
            JobFormDTO jobFormDTO = createJobFormDTO();
            when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());
            when(currentUserService.getResearchGroupIfProfessor()).thenReturn(testResearchGroup);

            Resource result = pdfExportService.exportJobPreviewToPDF(jobFormDTO, testLabels);

            assertThat(result).isNotNull();
            verify(userRepository).findById(TEST_USER_ID);
        }

        @Test
        void shouldHandleNoResearchGroup() {
            JobFormDTO jobFormDTO = createJobFormDTO();
            when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
            when(currentUserService.getResearchGroupIfProfessor()).thenThrow(new AccessDeniedException("No research group"));

            Resource result = pdfExportService.exportJobPreviewToPDF(jobFormDTO, testLabels);

            assertThat(result).isNotNull();
            verify(currentUserService).getResearchGroupIfProfessor();
        }

        @Test
        void shouldHandleNullJobFormFields() {
            JobFormDTO jobFormDTO = createJobFormDTO();
            when(jobFormDTO.workload()).thenReturn(null);
            when(jobFormDTO.contractDuration()).thenReturn(null);
            when(jobFormDTO.fundingType()).thenReturn(null);
            when(jobFormDTO.startDate()).thenReturn(null);
            when(jobFormDTO.endDate()).thenReturn(null);

            when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
            when(currentUserService.getResearchGroupIfProfessor()).thenReturn(testResearchGroup);

            Resource result = pdfExportService.exportJobPreviewToPDF(jobFormDTO, testLabels);

            assertThat(result).isNotNull();
        }

        @Test
        void shouldHandleUserWithNoName() {
            JobFormDTO jobFormDTO = createJobFormDTO();
            User userWithNoName = UserTestData.newUserAll(TEST_USER_ID, "test@example.com", null, null);
            when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(userWithNoName));
            when(currentUserService.getResearchGroupIfProfessor()).thenReturn(testResearchGroup);

            Resource result = pdfExportService.exportJobPreviewToPDF(jobFormDTO, testLabels);

            assertThat(result).isNotNull();
        }
    }

    @Nested
    class GenerateFilenames {

        @Test
        void shouldGenerateApplicationFilenameSuccessfully() {
            ApplicationDetailDTO applicationDetail = createApplicationDetailDTO();
            when(applicationService.getApplicationDetail(TEST_APPLICATION_ID)).thenReturn(applicationDetail);

            String filename = pdfExportService.generateApplicationFilename(TEST_APPLICATION_ID, "application");

            assertThat(filename).isNotNull();
            assertThat(filename).endsWith("_application.pdf");
            assertThat(filename).contains("Test_Job_Title");
            verify(applicationService).getApplicationDetail(TEST_APPLICATION_ID);
        }

        @Test
        void shouldGenerateJobFilenameSuccessfully() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);

            String filename = pdfExportService.generateJobFilename(TEST_JOB_ID, "job");

            assertThat(filename).isNotNull();
            assertThat(filename).endsWith("_job.pdf");
            assertThat(filename).contains("Test_Job_Title");
            verify(jobService).getJobDetails(TEST_JOB_ID);
        }

        @Test
        void shouldGenerateJobFilenameForPreviewSuccessfully() {
            JobFormDTO jobFormDTO = createJobFormDTO();

            String filename = pdfExportService.generateJobFilenameForPreview(jobFormDTO, "preview");

            assertThat(filename).isNotNull();
            assertThat(filename).endsWith("_preview.pdf");
            assertThat(filename).contains("Test_Job_Form_Title");
        }

        @Test
        void shouldSanitizeFilenameWithSpecialCharacters() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            when(jobDetail.title()).thenReturn("Test/Job:Title*With?Special|Characters");
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);

            String filename = pdfExportService.generateJobFilename(TEST_JOB_ID, "job");

            assertThat(filename).isNotNull();
            assertThat(filename).doesNotContain("/", ":", "*", "?", "|");
            assertThat(filename).matches("^[a-zA-Z0-9-_]+\\.pdf$");
        }

        @Test
        void shouldTruncateLongFilenames() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            String longTitle = "A".repeat(100);
            when(jobDetail.title()).thenReturn(longTitle);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);

            String filename = pdfExportService.generateJobFilename(TEST_JOB_ID, "job");

            assertThat(filename).isNotNull();
            assertThat(filename.length()).isLessThanOrEqualTo(60);
        }

        @Test
        void shouldHandleNullTitle() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            when(jobDetail.title()).thenReturn(null);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);

            String filename = pdfExportService.generateJobFilename(TEST_JOB_ID, "job");

            assertThat(filename).isNotNull();
            assertThat(filename).startsWith("document");
        }
    }

    @Nested
    class ResearchGroupSection {

        @Test
        void shouldIncludeCompleteResearchGroupInfo() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.isProfessor()).thenReturn(true);

            Resource result = pdfExportService.exportJobToPDF(TEST_JOB_ID, testLabels);

            assertThat(result).isNotNull();
            verify(jobService).getJobDetails(TEST_JOB_ID);
        }

        @Test
        void shouldHandleResearchGroupWithNullFields() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            ResearchGroup groupWithNulls = new ResearchGroup();

            groupWithNulls.setName("Test Group");
            groupWithNulls.setDescription(null);
            groupWithNulls.setEmail(null);
            groupWithNulls.setWebsite(null);
            groupWithNulls.setStreet(null);
            groupWithNulls.setPostalCode(null);
            groupWithNulls.setCity(null);

            when(jobDetail.researchGroup()).thenReturn(groupWithNulls);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.isProfessor()).thenReturn(true);

            Resource result = pdfExportService.exportJobToPDF(TEST_JOB_ID, testLabels);

            assertThat(result).isNotNull();
        }

        @Test
        void shouldHandleResearchGroupWithEmptyStrings() {
            JobDetailDTO jobDetail = createJobDetailDTO();
            ResearchGroup groupWithEmpty = new ResearchGroup();
            groupWithEmpty.setName("Test Group");
            groupWithEmpty.setDescription("");
            groupWithEmpty.setEmail("");
            groupWithEmpty.setWebsite("");
            groupWithEmpty.setStreet("");
            groupWithEmpty.setPostalCode("");
            groupWithEmpty.setCity("");

            when(jobDetail.researchGroup()).thenReturn(groupWithEmpty);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.isProfessor()).thenReturn(true);

            Resource result = pdfExportService.exportJobToPDF(TEST_JOB_ID, testLabels);

            assertThat(result).isNotNull();
        }
    }

    @Nested
    class MetadataGeneration {

        @Test
        void shouldIncludeUserNameInMetadata() {
            ApplicationDetailDTO applicationDetail = createApplicationDetailDTO();
            JobDetailDTO jobDetail = createJobDetailDTO();

            when(applicationService.getApplicationDetail(TEST_APPLICATION_ID)).thenReturn(applicationDetail);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.getCurrentUserFullName()).thenReturn("John Doe");
            when(currentUserService.getCurrentUserFullNameIfAvailable()).thenReturn(Optional.of("John Doe"));

            Resource result = pdfExportService.exportApplicationToPDF(TEST_APPLICATION_ID, testLabels);

            assertThat(result).isNotNull();
            verify(currentUserService).getCurrentUserFullNameIfAvailable();
        }

        @Test
        void shouldHandleMissingUserNameInMetadata() {
            ApplicationDetailDTO applicationDetail = createApplicationDetailDTO();
            JobDetailDTO jobDetail = createJobDetailDTO();

            when(applicationService.getApplicationDetail(TEST_APPLICATION_ID)).thenReturn(applicationDetail);
            when(jobService.getJobDetails(TEST_JOB_ID)).thenReturn(jobDetail);
            when(currentUserService.getCurrentUserFullName()).thenReturn("John Doe");
            when(currentUserService.getCurrentUserFullNameIfAvailable()).thenReturn(Optional.empty());

            Resource result = pdfExportService.exportApplicationToPDF(TEST_APPLICATION_ID, testLabels);

            assertThat(result).isNotNull();
            verify(currentUserService).getCurrentUserFullNameIfAvailable();
        }
    }

    @Nested
    class DateFormatting {

        @Test
        void shouldFormatLocalDateCorrectly() throws Exception {
            var formatDateMethod = PDFExportService.class.getDeclaredMethod("formatDate", Object.class);
            formatDateMethod.setAccessible(true);

            LocalDate testDate = LocalDate.of(2024, 3, 15);
            String result = (String) formatDateMethod.invoke(pdfExportService, testDate);

            assertThat(result).isEqualTo("15.03.2024");
        }

        @Test
        void shouldHandleNullDate() throws Exception {
            var formatDateMethod = PDFExportService.class.getDeclaredMethod("formatDate", Object.class);
            formatDateMethod.setAccessible(true);

            String result = (String) formatDateMethod.invoke(pdfExportService, (Object) null);

            assertThat(result).isEqualTo("-");
        }

        @Test
        void shouldHandleNonLocalDateObjectWithToString() throws Exception {
            var formatDateMethod = PDFExportService.class.getDeclaredMethod("formatDate", Object.class);
            formatDateMethod.setAccessible(true);

            Date utilDate = new Date(1710460800000L);
            String result = (String) formatDateMethod.invoke(pdfExportService, utilDate);

            assertThat(result).isNotNull();
            assertThat(result).isEqualTo(utilDate.toString());
        }

        @Test
        void shouldHandleArbitraryObjectWithToString() throws Exception {
            var formatDateMethod = PDFExportService.class.getDeclaredMethod("formatDate", Object.class);
            formatDateMethod.setAccessible(true);

            String arbitraryString = "2024-03-15";
            String result = (String) formatDateMethod.invoke(pdfExportService, arbitraryString);

            assertThat(result).isEqualTo("2024-03-15");
        }
    }
}
