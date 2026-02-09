package de.tum.cit.aet.core.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.job.constants.Campus;
import de.tum.cit.aet.job.constants.FundingType;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.dto.JobPreviewRequest;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
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
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PDFExportResourceTest extends AbstractResourceTest {

    private static final String BASE_URL = "/api/export";
    private static final byte[] PDF_MAGIC_NUMBER = "%PDF-".getBytes();
    private static final int MIN_PDF_SIZE = 1000;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    UserRepository userRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    ApplicantRepository applicantRepository;

    @Autowired
    JobRepository jobRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    MvcTestClient api;

    User professor;
    ResearchGroup group;
    Applicant applicant;
    Applicant applicantWithWebsiteAndLinkedin;
    Job job;
    Job jobWithNulls;
    Application application;
    Application applicationWithWebsiteAndLinkedin;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        group = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, group);
        applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
        applicantWithWebsiteAndLinkedin = ApplicantTestData.savedWithNewUserWithWebsiteAndLinkedin(applicantRepository);
        job = JobTestData.saved(jobRepository, professor, group, null, null, null);
        application = ApplicationTestData.savedAll(
            applicationRepository,
            job,
            applicant,
            ApplicationState.SENT,
            LocalDate.now(),
            "Test projects",
            "Test skills",
            "Test motivation"
        );
        applicationWithWebsiteAndLinkedin = ApplicationTestData.savedAll(
            applicationRepository,
            job,
            applicantWithWebsiteAndLinkedin,
            ApplicationState.SENT,
            LocalDate.now(),
            "Test projects",
            "Test skills",
            "Test motivation"
        );
    }

    private MvcTestClient asProfessor(User user) {
        return api.with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"));
    }

    private MvcTestClient asApplicant(Applicant applicant) {
        return api.with(JwtPostProcessors.jwtUser(applicant.getUserId(), "ROLE_APPLICANT"));
    }

    private Map<String, String> createCompleteLabelsMap() {
        Map<String, String> labels = new java.util.HashMap<>();
        addHeaderAndOverviewLabels(labels);
        addPersonalLabels(labels);
        addEducationAndMetadataLabels(labels);
        addJobSpecificLabels(labels);
        return labels;
    }

    private void addHeaderAndOverviewLabels(Map<String, String> labels) {
        // Application header
        labels.put("application", "Application");
        labels.put("headline", "Application for ");
        labels.put("applicationBy", "Application by ");
        labels.put("forPosition", " for position ");
        labels.put("status", "Status: ");

        // Overview
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

    private void addPersonalLabels(Map<String, String> labels) {
        // Personal Statements
        labels.put("personalStatements", "Personal Statements");
        labels.put("motivation", "Motivation");
        labels.put("skills", "Special Skills");
        labels.put("researchExperience", "Research Experience");

        // Personal Information
        labels.put("personalInformation", "Personal Information");
        labels.put("applicantInfo", "Applicant Information");
        labels.put("preferredLanguage", "Preferred Language");
        labels.put("desiredStartDate", "Desired Start Date");
        labels.put("gender", "Gender");
        labels.put("nationality", "Nationality");
        labels.put("website", "Website");
        labels.put("linkedIn", "LinkedIn");
    }

    private void addEducationAndMetadataLabels(Map<String, String> labels) {
        // Education
        labels.put("bachelorInfo", "Bachelor Information");
        labels.put("masterInfo", "Master Information");
        labels.put("degreeName", "Degree Name");
        labels.put("university", "University");
        labels.put("grade", "Grade");

        // Footer/Metadata
        labels.put("thisDocumentWasGeneratedOn", "This document was generated on ");
        labels.put("byUser", " by user ");
        labels.put("usingTumapply", " using TUMapply.");
        labels.put("metaEndText", "End of document");
        labels.put("page", "Page");
        labels.put("of", "of");
    }

    private void addJobSpecificLabels(Map<String, String> labels) {
        // Job specific
        labels.put("jobPdfEnding", "Job_Posting");
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

    private void assertValidPdf(byte[] pdfBytes) {
        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes).isNotEmpty();
        assertThat(pdfBytes).startsWith(PDF_MAGIC_NUMBER);
        assertThat(pdfBytes.length).isGreaterThan(MIN_PDF_SIZE);
    }

    @Nested
    class ExportApplicationToPDF {

        @Test
        void exportApplicationToPDFReturnsPdfForAuthenticatedUser() {
            Map<String, String> labels = createCompleteLabelsMap();

            byte[] result = asApplicant(applicant).postAndReturnBytes(
                BASE_URL + "/application/" + application.getApplicationId() + "/pdf",
                labels,
                200,
                MediaType.APPLICATION_PDF
            );

            assertValidPdf(result);
        }

        @Test
        void exportApplicationToPDFReturns401ForUnauthenticatedUser() {
            Map<String, String> labels = createCompleteLabelsMap();

            Void result = api
                .withoutPostProcessors()
                .postAndRead(
                    BASE_URL + "/application/" + application.getApplicationId() + "/pdf",
                    labels,
                    Void.class,
                    401,
                    MediaType.APPLICATION_PDF
                );

            assertThat(result).isNull();
        }

        @Test
        void shouldExportApplicationWithWebsiteAndLinkedIn() {
            Map<String, String> labels = createCompleteLabelsMap();

            byte[] result = asApplicant(applicantWithWebsiteAndLinkedin).postAndReturnBytes(
                BASE_URL + "/application/" + applicationWithWebsiteAndLinkedin.getApplicationId() + "/pdf",
                labels,
                200,
                MediaType.APPLICATION_PDF
            );

            assertValidPdf(result);
        }

        @Test
        void shouldExportApplicationWithMasterDegreeNameNull() {
            Applicant applicantWithMasterNameNull = ApplicantTestData.savedWithNewUser(applicantRepository);
            applicantWithMasterNameNull.setMasterDegreeName(null);
            applicantRepository.save(applicantWithMasterNameNull);

            Application appWithMaster = ApplicationTestData.savedAll(
                applicationRepository,
                job,
                applicantWithMasterNameNull,
                ApplicationState.SENT,
                LocalDate.now(),
                "Test",
                "Test",
                "Test"
            );

            Map<String, String> labels = createCompleteLabelsMap();

            byte[] result = asApplicant(applicantWithMasterNameNull).postAndReturnBytes(
                BASE_URL + "/application/" + appWithMaster.getApplicationId() + "/pdf",
                labels,
                200,
                MediaType.APPLICATION_PDF
            );

            assertValidPdf(result);
        }
    }

    @Nested
    class ExportJobToPDF {

        @Test
        void exportJobToPDFReturnsPdfForPublicAccess() {
            Map<String, String> labels = createCompleteLabelsMap();

            byte[] result = api
                .withoutPostProcessors()
                .postAndReturnBytes(BASE_URL + "/job/" + job.getJobId() + "/pdf", labels, 200, MediaType.APPLICATION_PDF);

            assertValidPdf(result);
        }

        @Test
        void shouldExportJobForEmployee() {
            User employee = UserTestData.savedEmployee(userRepository, group);

            byte[] result = api
                .with(JwtPostProcessors.jwtUser(employee.getUserId(), "ROLE_EMPLOYEE"))
                .postAndReturnBytes(
                    BASE_URL + "/job/" + job.getJobId() + "/pdf",
                    createCompleteLabelsMap(),
                    200,
                    MediaType.APPLICATION_PDF
                );

            assertValidPdf(result);
        }

        @Test
        void shouldHandleJobWithNullFields() {
            ResearchGroup groupWithNoContact = ResearchGroupTestData.newRgOptional();
            groupWithNoContact = researchGroupRepository.save(groupWithNoContact);

            User prof = UserTestData.savedProfessor(userRepository, groupWithNoContact);
            Job jobWithEmptyContact = JobTestData.savedNull(jobRepository, prof, groupWithNoContact);

            byte[] result = api
                .withoutPostProcessors()
                .postAndReturnBytes(
                    BASE_URL + "/job/" + jobWithEmptyContact.getJobId() + "/pdf",
                    createCompleteLabelsMap(),
                    200,
                    MediaType.APPLICATION_PDF
                );

            assertValidPdf(result);
        }
    }

    @Nested
    class ExportJobPreviewToPDF {

        @Test
        void exportJobPreviewToPDFReturnsPdfForProfessor() {
            JobFormDTO jobFormDTO = new JobFormDTO(
                UUID.randomUUID(),
                "Software Engineer",
                "AI Research",
                "Computer Science",
                professor.getUserId(),
                Campus.GARCHING,
                null,
                null,
                20,
                null,
                null,
                "Job Description",
                "Stellenbeschreibung",
                JobState.DRAFT,
                null,
                true
            );
            Map<String, String> labels = createCompleteLabelsMap();
            JobPreviewRequest request = new JobPreviewRequest(jobFormDTO, labels);

            byte[] result = asProfessor(professor).postAndReturnBytes(
                BASE_URL + "/job/preview/pdf",
                request,
                200,
                MediaType.APPLICATION_PDF
            );

            assertValidPdf(result);
        }

        @Test
        void exportJobPreviewToPDFReturns403ForApplicant() {
            JobFormDTO jobFormDTO = JobFormDTO.getFromEntity(job);
            Map<String, String> labels = createCompleteLabelsMap();
            JobPreviewRequest request = new JobPreviewRequest(jobFormDTO, labels);

            Void result = asApplicant(applicant).postAndRead(
                BASE_URL + "/job/preview/pdf",
                request,
                Void.class,
                403,
                MediaType.APPLICATION_PDF
            );

            assertThat(result).isNull();
        }

        @Test
        void exportJobPreviewToPDFReturns401ForUnauthenticatedUser() {
            JobFormDTO jobFormDTO = JobFormDTO.getFromEntity(job);
            JobPreviewRequest request = new JobPreviewRequest(jobFormDTO, createCompleteLabelsMap());

            Void result = api
                .withoutPostProcessors()
                .postAndRead(BASE_URL + "/job/preview/pdf", request, Void.class, 401, MediaType.APPLICATION_PDF);

            assertThat(result).isNull();
        }

        @Test
        void shouldHandleJobPreviewWithoutResearchGroup() {
            User userWithoutRG = UserTestData.createUserWithoutResearchGroup(userRepository, "test@example.com", "Test", "User", "ab12xyz");

            JobFormDTO jobFormDTO = new JobFormDTO(
                UUID.randomUUID(),
                "Test Job",
                "AI",
                "CS",
                userWithoutRG.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                null,
                3,
                FundingType.FULLY_FUNDED,
                "Description",
                "Beschreibung",
                JobState.DRAFT,
                null,
                true
            );

            JobPreviewRequest request = new JobPreviewRequest(jobFormDTO, createCompleteLabelsMap());

            byte[] result = api
                .with(JwtPostProcessors.jwtUser(userWithoutRG.getUserId(), "ROLE_PROFESSOR"))
                .postAndReturnBytes(BASE_URL + "/job/preview/pdf", request, 200, MediaType.APPLICATION_PDF);

            assertValidPdf(result);
        }
    }

    @Nested
    class Authorization {

        @Test
        void unauthenticatedReturns401ForApplicationExport() {
            Void result = api
                .withoutPostProcessors()
                .postAndRead(
                    BASE_URL + "/application/" + application.getApplicationId() + "/pdf",
                    Map.of(),
                    Void.class,
                    401,
                    MediaType.APPLICATION_PDF
                );

            assertThat(result).isNull();
        }

        @Test
        void unauthenticatedReturns401ForJobPreviewExport() {
            JobFormDTO jobFormDTO = JobFormDTO.getFromEntity(job);
            JobPreviewRequest request = new JobPreviewRequest(jobFormDTO, Map.of());

            Void result = api
                .withoutPostProcessors()
                .postAndRead(BASE_URL + "/job/preview/pdf", request, Void.class, 401, MediaType.APPLICATION_PDF);

            assertThat(result).isNull();
        }
    }
}
