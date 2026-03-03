package de.tum.cit.aet.core.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.domain.dto.ApplicationDetailDTO;
import de.tum.cit.aet.application.domain.dto.ApplicationPDFRequest;
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
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBuffer;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
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

    private ApplicationPDFRequest createApplicationPdfRequest(Application application, Job job) {
        Map<String, String> labels = createCompleteLabelsMap();
        ApplicationDetailDTO appDto = ApplicationDetailDTO.getFromEntity(application, job);
        return new ApplicationPDFRequest(appDto, labels);
    }

    // Helper to extract text from a PDF byte array using PDFBox
    private String extractTextFromPdf(byte[] pdfBytes) {
        try (PDDocument doc = Loader.loadPDF(new RandomAccessReadBuffer(pdfBytes))) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract text from PDF", e);
        }
    }

    @Nested
    class ExportApplicationToPDF {

        @Test
        void exportApplicationToPDFReturnsPdfForAuthenticatedUser() {
            ApplicationPDFRequest request = createApplicationPdfRequest(application, job);

            byte[] result = asApplicant(applicant).postAndReturnBytes(
                BASE_URL + "/application/pdf",
                request,
                200,
                MediaType.APPLICATION_PDF
            );
            assertValidPdf(result);
        }

        @Test
        void exportApplicationToPDFReturns401ForUnauthenticatedUser() {
            ApplicationPDFRequest request = createApplicationPdfRequest(application, job);

            Void result = api
                .withoutPostProcessors()
                .postAndRead(BASE_URL + "/application/pdf", request, Void.class, 401, MediaType.APPLICATION_PDF);
            assertThat(result).isNull();
        }

        @Test
        void shouldExportApplicationWithWebsiteAndLinkedIn() {
            ApplicationPDFRequest request = createApplicationPdfRequest(application, job);

            byte[] result = asApplicant(applicantWithWebsiteAndLinkedin).postAndReturnBytes(
                BASE_URL + "/application/pdf",
                request,
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
            ApplicationPDFRequest request = createApplicationPdfRequest(appWithMaster, job);

            byte[] result = asApplicant(applicantWithMasterNameNull).postAndReturnBytes(
                BASE_URL + "/application/pdf",
                request,
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

            // default labels -> no explicit lang set, service should fallback (commonly to EN)
            byte[] result = api
                .withoutPostProcessors()
                .postAndReturnBytes(BASE_URL + "/job/" + job.getJobId() + "/pdf", labels, 200, MediaType.APPLICATION_PDF);

            assertValidPdf(result);
            String text = extractTextFromPdf(result);
            // JobTestData.saved() creates a job with default content; ensure at least the job title/description label exists
            assertThat(text).contains(labels.get("jobDetails"));
        }

        @Test
        void exportJobToPDFUsesLanguageFromLabels() {
            // create a job with explicit EN/DE descriptions
            String en = "This is the English job description unique-en-xyz";
            String de = "Das ist die deutsche Stellenbeschreibung unique-de-xyz";
            Job jobWithBoth = JobTestData.savedAll(
                jobRepository,
                "Lang Test Job",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                en,
                de,
                JobState.PUBLISHED
            );

            Map<String, String> labelsEn = createCompleteLabelsMap();
            labelsEn.put("lang", "en");

            byte[] pdfEn = api
                .withoutPostProcessors()
                .postAndReturnBytes(BASE_URL + "/job/" + jobWithBoth.getJobId() + "/pdf", labelsEn, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfEn);
            String textEn = extractTextFromPdf(pdfEn);
            assertThat(textEn).contains("unique-en-xyz");

            Map<String, String> labelsDe = createCompleteLabelsMap();
            labelsDe.put("lang", "de");

            byte[] pdfDe = api
                .withoutPostProcessors()
                .postAndReturnBytes(BASE_URL + "/job/" + jobWithBoth.getJobId() + "/pdf", labelsDe, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfDe);
            String textDe = extractTextFromPdf(pdfDe);
            assertThat(textDe).contains("unique-de-xyz");
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

        @Test
        void exportJobToPDFHandlesAllDescriptionCombinations() {
            // both present
            String enBoth = "EN both unique-en-both";
            String deBoth = "DE both unique-de-both";
            Job both = JobTestData.savedAll(
                jobRepository,
                "Both Job",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                enBoth,
                deBoth,
                JobState.PUBLISHED
            );

            Map<String, String> labelsEn = createCompleteLabelsMap();
            labelsEn.put("lang", "en");
            byte[] pdfBothEn = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + both.getJobId() + "/pdf", labelsEn, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfBothEn);
            assertThat(extractTextFromPdf(pdfBothEn)).contains("unique-en-both");

            Map<String, String> labelsDe = createCompleteLabelsMap();
            labelsDe.put("lang", "de");
            byte[] pdfBothDe = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + both.getJobId() + "/pdf", labelsDe, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfBothDe);
            assertThat(extractTextFromPdf(pdfBothDe)).contains("unique-de-both");

            // only EN present (DE null)
            String enOnly = "EN only unique-en-only";
            Job onlyEn = JobTestData.savedAll(
                jobRepository,
                "EN Job",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                enOnly,
                null,
                JobState.PUBLISHED
            );

            Map<String, String> labelsDeFallback = createCompleteLabelsMap();
            labelsDeFallback.put("lang", "de");
            byte[] pdfOnlyEnDeRequested = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + onlyEn.getJobId() + "/pdf", labelsDeFallback, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfOnlyEnDeRequested);
            // requested DE but only EN exists -> fallback to EN
            assertThat(extractTextFromPdf(pdfOnlyEnDeRequested)).contains("unique-en-only");

            // only DE present (EN null)
            String deOnly = "DE only unique-de-only";
            Job onlyDe = JobTestData.savedAll(
                jobRepository,
                "DE Job",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                null,
                deOnly,
                JobState.PUBLISHED
            );

            Map<String, String> labelsEnRequested = createCompleteLabelsMap();
            labelsEnRequested.put("lang", "en");
            byte[] pdfOnlyDeEnRequested = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + onlyDe.getJobId() + "/pdf", labelsEnRequested, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfOnlyDeEnRequested);
            // requested EN but only DE exists -> fallback to DE
            assertThat(extractTextFromPdf(pdfOnlyDeEnRequested)).contains("unique-de-only");

            // none present (both null) -> expect '-' placeholder
            Job none = JobTestData.savedAll(
                jobRepository,
                "None Job",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                null,
                null,
                JobState.PUBLISHED
            );

            byte[] pdfNone = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + none.getJobId() + "/pdf", createCompleteLabelsMap(), 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfNone);
            // the PDF builder uses '-' when description missing
            assertThat(extractTextFromPdf(pdfNone)).contains("-");

            // both empty strings -> should be treated as missing -> '-'
            Job bothEmpty = JobTestData.savedAll(
                jobRepository,
                "Both Empty Job",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "",
                "",
                JobState.PUBLISHED
            );

            byte[] pdfBothEmpty = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + bothEmpty.getJobId() + "/pdf", createCompleteLabelsMap(), 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfBothEmpty);
            assertThat(extractTextFromPdf(pdfBothEmpty)).contains("-");
        }

        @Test
        void exportJobToPDFDeBranchEdgeCases() {
            // de is only whitespace, en present -> should fallback to en
            Job deWhitespace = JobTestData.savedAll(
                jobRepository,
                "De whitespace",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "EN fallback unique-en-ws",
                "   ",
                JobState.PUBLISHED
            );

            Map<String, String> labelsDe = createCompleteLabelsMap();
            labelsDe.put("lang", "de");
            byte[] pdfDeWs = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + deWhitespace.getJobId() + "/pdf", labelsDe, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfDeWs);
            assertThat(extractTextFromPdf(pdfDeWs)).contains("unique-en-ws");

            // de empty string, en empty string -> expect '-'
            Job bothEmptyExplicit = JobTestData.savedAll(
                jobRepository,
                "Both Empty Explicit",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "",
                "",
                JobState.PUBLISHED
            );

            Map<String, String> labelsDeRequested = createCompleteLabelsMap();
            labelsDeRequested.put("lang", "de");
            byte[] pdfBothEmptyExplicit = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + bothEmptyExplicit.getJobId() + "/pdf", labelsDeRequested, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfBothEmptyExplicit);
            assertThat(extractTextFromPdf(pdfBothEmptyExplicit)).contains("-");
        }

        @Test
        void exportJobToPDFSelectsDeWhenOnlyDePresent() {
            String deOnly = "DE sole unique-de-sole";
            Job onlyDe = JobTestData.savedAll(
                jobRepository,
                "DE Sole Job",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                null,
                deOnly,
                JobState.PUBLISHED
            );

            Map<String, String> labelsDe = createCompleteLabelsMap();
            labelsDe.put("lang", "de");
            byte[] pdf = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + onlyDe.getJobId() + "/pdf", labelsDe, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdf);
            assertThat(extractTextFromPdf(pdf)).contains("unique-de-sole");
        }

        @Test
        void exportJobToPDFSelectsEnWhenOnlyEnPresent() {
            String enOnly = "EN sole unique-en-sole";
            Job onlyEn = JobTestData.savedAll(
                jobRepository,
                "EN Sole Job",
                "AI",
                "CS",
                professor,
                group,
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                enOnly,
                null,
                JobState.PUBLISHED
            );

            Map<String, String> labelsEn = createCompleteLabelsMap();
            labelsEn.put("lang", "en");
            byte[] pdf = api.withoutPostProcessors().postAndReturnBytes(BASE_URL + "/job/" + onlyEn.getJobId() + "/pdf", labelsEn, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdf);
            assertThat(extractTextFromPdf(pdf)).contains("unique-en-sole");
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

        @Test
        void exportJobPreviewUsesLanguageFromLabels() {
            // create a job form with explicit EN/DE descriptions
            JobFormDTO jobFormDTO = new JobFormDTO(
                UUID.randomUUID(),
                "Preview Lang Job",
                "AI Research",
                "Computer Science",
                professor.getUserId(),
                Campus.GARCHING,
                null,
                null,
                20,
                null,
                null,
                "Preview English unique-en-preview",
                "Vorschau Deutsch unique-de-preview",
                JobState.DRAFT,
                null,
                true
            );

            Map<String, String> labelsEn = createCompleteLabelsMap();
            labelsEn.put("lang", "en");
            JobPreviewRequest reqEn = new JobPreviewRequest(jobFormDTO, labelsEn);

            byte[] pdfEn = asProfessor(professor).postAndReturnBytes(
                BASE_URL + "/job/preview/pdf",
                reqEn,
                200,
                MediaType.APPLICATION_PDF
            );
            assertValidPdf(pdfEn);
            String textEn = extractTextFromPdf(pdfEn);
            assertThat(textEn).contains("unique-en-preview");

            Map<String, String> labelsDe = createCompleteLabelsMap();
            labelsDe.put("lang", "de");
            JobPreviewRequest reqDe = new JobPreviewRequest(jobFormDTO, labelsDe);

            byte[] pdfDe = asProfessor(professor).postAndReturnBytes(
                BASE_URL + "/job/preview/pdf",
                reqDe,
                200,
                MediaType.APPLICATION_PDF
            );
            assertValidPdf(pdfDe);
            String textDe = extractTextFromPdf(pdfDe);
            assertThat(textDe).contains("unique-de-preview");
        }

        @Test
        void exportJobPreviewHandlesAllDescriptionCombinations() {
            // both present
            JobFormDTO both = new JobFormDTO(
                UUID.randomUUID(),
                "Preview Both",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "Preview EN both unique-en-pb",
                "Preview DE both unique-de-pb",
                JobState.DRAFT,
                null,
                true
            );

            Map<String, String> labelsEn = createCompleteLabelsMap();
            labelsEn.put("lang", "en");
            JobPreviewRequest reqEn = new JobPreviewRequest(both, labelsEn);
            byte[] pdfBothEn = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", reqEn, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfBothEn);
            assertThat(extractTextFromPdf(pdfBothEn)).contains("unique-en-pb");

            Map<String, String> labelsDe = createCompleteLabelsMap();
            labelsDe.put("lang", "de");
            JobPreviewRequest reqDe = new JobPreviewRequest(both, labelsDe);
            byte[] pdfBothDe = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", reqDe, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfBothDe);
            assertThat(extractTextFromPdf(pdfBothDe)).contains("unique-de-pb");

            // only EN
            JobFormDTO onlyEn = new JobFormDTO(
                UUID.randomUUID(),
                "Preview EN",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "Preview EN only unique-en-only-pb",
                null,
                JobState.DRAFT,
                null,
                true
            );

            Map<String, String> labelsDeRequest = createCompleteLabelsMap();
            labelsDeRequest.put("lang", "de");
            JobPreviewRequest onlyEnReq = new JobPreviewRequest(onlyEn, labelsDeRequest);
            byte[] pdfOnlyEnFallback = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", onlyEnReq, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfOnlyEnFallback);
            assertThat(extractTextFromPdf(pdfOnlyEnFallback)).contains("unique-en-only-pb");

            // only DE
            JobFormDTO onlyDe = new JobFormDTO(
                UUID.randomUUID(),
                "Preview DE",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                null,
                "Preview DE only unique-de-only-pb",
                JobState.DRAFT,
                null,
                true
            );

            Map<String, String> labelsEnRequest = createCompleteLabelsMap();
            labelsEnRequest.put("lang", "en");
            JobPreviewRequest onlyDeReq = new JobPreviewRequest(onlyDe, labelsEnRequest);
            byte[] pdfOnlyDeFallback = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", onlyDeReq, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfOnlyDeFallback);
            assertThat(extractTextFromPdf(pdfOnlyDeFallback)).contains("unique-de-only-pb");

            // none (both null)
            JobFormDTO none = new JobFormDTO(
                UUID.randomUUID(),
                "Preview None",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                null,
                null,
                JobState.DRAFT,
                null,
                true
            );

            JobPreviewRequest noneReq = new JobPreviewRequest(none, createCompleteLabelsMap());
            byte[] pdfNone = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", noneReq, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfNone);
            assertThat(extractTextFromPdf(pdfNone)).contains("-");

            // both empty strings
            JobFormDTO bothEmpty = new JobFormDTO(
                UUID.randomUUID(),
                "Preview Both Empty",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "",
                "",
                JobState.DRAFT,
                null,
                true
            );

            JobPreviewRequest bothEmptyReq = new JobPreviewRequest(bothEmpty, createCompleteLabelsMap());
            byte[] pdfBothEmpty = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", bothEmptyReq, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfBothEmpty);
            assertThat(extractTextFromPdf(pdfBothEmpty)).contains("-");
        }

        @Test
        void exportJobPreviewDeBranchEdgeCases() {
            // de is whitespace, en present -> fallback to en
            JobFormDTO deWs = new JobFormDTO(
                UUID.randomUUID(),
                "Preview De WS",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "Preview EN fallback unique-en-ws-pb",
                "   ",
                JobState.DRAFT,
                null,
                true
            );

            Map<String, String> labelsDe = createCompleteLabelsMap();
            labelsDe.put("lang", "de");
            JobPreviewRequest reqDeWs = new JobPreviewRequest(deWs, labelsDe);
            byte[] pdfDeWs = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", reqDeWs, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfDeWs);
            assertThat(extractTextFromPdf(pdfDeWs)).contains("unique-en-ws-pb");

            // both explicit empty -> '-'
            JobFormDTO bothEmptyExplicit = new JobFormDTO(
                UUID.randomUUID(),
                "Preview Both Empty Explicit",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "",
                "",
                JobState.DRAFT,
                null,
                true
            );

            JobPreviewRequest bothEmptyReq = new JobPreviewRequest(bothEmptyExplicit, labelsDe);
            byte[] pdfBothEmpty = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", bothEmptyReq, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfBothEmpty);
            assertThat(extractTextFromPdf(pdfBothEmpty)).contains("-");

            // de present, en null -> should use de
            JobFormDTO onlyDe = new JobFormDTO(
                UUID.randomUUID(),
                "Preview DE only",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                null,
                "Preview DE only unique-de-only-pb",
                JobState.DRAFT,
                null,
                true
            );

            Map<String, String> labelsDeOnly = createCompleteLabelsMap();
            labelsDeOnly.put("lang", "de");
            JobPreviewRequest reqDeOnly = new JobPreviewRequest(onlyDe, labelsDeOnly);
            byte[] pdfDeOnly = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", reqDeOnly, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfDeOnly);
            assertThat(extractTextFromPdf(pdfDeOnly)).contains("unique-de-only-pb");

            // en present, de null -> should use en
            JobFormDTO onlyEn = new JobFormDTO(
                UUID.randomUUID(),
                "Preview EN only",
                "AI",
                "CS",
                professor.getUserId(),
                Campus.GARCHING,
                LocalDate.now(),
                LocalDate.now(),
                20,
                3,
                FundingType.FULLY_FUNDED,
                "Preview EN only unique-en-only-pb",
                null,
                JobState.DRAFT,
                null,
                true
            );

            Map<String, String> labelsEnOnly = createCompleteLabelsMap();
            labelsEnOnly.put("lang", "en");
            JobPreviewRequest reqEnOnly = new JobPreviewRequest(onlyEn, labelsEnOnly);
            byte[] pdfEnOnly = asProfessor(professor).postAndReturnBytes(BASE_URL + "/job/preview/pdf", reqEnOnly, 200, MediaType.APPLICATION_PDF);
            assertValidPdf(pdfEnOnly);
            assertThat(extractTextFromPdf(pdfEnOnly)).contains("unique-en-only-pb");
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
