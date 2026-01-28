package de.tum.cit.aet.core.web;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.domain.Job;
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
import de.tum.cit.aet.utility.testdata.DocumentTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * Integration tests for {@link UserDataExportResource}.
 */
public class UserDataExportResourceTest extends AbstractResourceTest {

    private static final String API_URL = "/api/users/export";

    @Autowired
    UserRepository userRepository;

    @Autowired
    ApplicantRepository applicantRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    JobRepository jobRepository;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    DocumentRepository documentRepository;

    @Autowired
    DocumentDictionaryRepository documentDictionaryRepository;

    @Autowired
    InterviewProcessRepository interviewProcessRepository;

    @Autowired
    InterviewSlotRepository interviewSlotRepository;

    @Autowired
    IntervieweeRepository intervieweeRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    @Value("${aet.storage.root}")
    private String storageRootConfig;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        api.withoutPostProcessors();
    }

    @Test
    void exportRequiresAuthentication() {
        api.getAndReturnBytes(API_URL, Map.of(), 401, MediaType.ALL);
    }

    @Test
    void exportReturnsZipWithSummaryForExistingUser() throws Exception {
        User user = UserTestData.createUserWithoutResearchGroup(userRepository, "export-user@tum.de", "Export", "User", "ab123cd");

        byte[] zipBytes = api
            .with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"))
            .getAndReturnBytes(API_URL, Map.of(), 200, MediaType.valueOf("application/zip"));

        assertThat(zipBytes).isNotNull().isNotEmpty().hasSizeGreaterThan(50);

        Set<String> entries = new HashSet<>();
        String summaryJson = null;

        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entries.add(entry.getName());
                if ("user_data_summary.json".equals(entry.getName())) {
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    zis.transferTo(out);
                    summaryJson = out.toString(StandardCharsets.UTF_8);
                }
                zis.closeEntry();
            }
        }

        assertThat(entries).contains("user_data_summary.json");
        assertThat(summaryJson).isNotNull().contains(user.getEmail());
    }

    @Test
    void exportSetsZipHeaders() {
        User user = UserTestData.createUserWithoutResearchGroup(userRepository, "export-headers@tum.de", "Export", "Headers", "cd456ef");

        MockHttpServletResponse response = api
            .with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"))
            .getAndReturnResponse(API_URL, Map.of(), 200, MediaType.valueOf("application/zip"));

        assertThat(response.getContentType()).isEqualTo("application/zip");
        assertThat(response.getHeader("Content-Disposition"))
            .isNotNull()
            .contains("attachment")
            .contains("user-data-export-" + user.getUserId())
            .contains(".zip");
    }

    @Test
    void exportIncludesApplicantDocumentsInZip() throws Exception {
        ResearchGroup researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        User professor = UserTestData.savedProfessor(userRepository, researchGroup);

        Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
        User applicantUser = applicant.getUser();

        Job publishedJob = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Published Role",
            JobState.PUBLISHED,
            LocalDate.now().plusDays(7)
        );

        Application application = ApplicationTestData.saved(applicationRepository, publishedJob, applicant, ApplicationState.SENT);

        String unsafeName = "cv:my?file.pdf";
        String expectedSanitized = "cv_my_file.pdf";
        DocumentTestData.savedDictionaryWithDocument(
            storageRootConfig,
            documentRepository,
            documentDictionaryRepository,
            professor,
            application,
            applicant,
            "/testdocs/test-doc1.pdf",
            "export-test-doc1.pdf",
            DocumentType.CV,
            unsafeName
        );

        byte[] zipBytes = api
            .with(JwtPostProcessors.jwtUser(applicantUser.getUserId(), "ROLE_APPLICANT"))
            .getAndReturnBytes(API_URL, Map.of(), 200, MediaType.valueOf("application/zip"));

        assertThat(zipBytes).isNotNull().isNotEmpty().hasSizeGreaterThan(50);

        Set<String> entries = new HashSet<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entries.add(entry.getName());
                zis.closeEntry();
            }
        }

        assertThat(entries).contains("user_data_summary.json");
        assertThat(entries).contains("documents/" + expectedSanitized);
    }

    @Test
    void exportIncludesIntervieweesForApplicant() throws Exception {
        ResearchGroup researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        User professor = UserTestData.savedProfessor(userRepository, researchGroup);

        Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
        User applicantUser = applicant.getUser();

        Job job = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Interview Role",
            JobState.PUBLISHED,
            LocalDate.now().plusDays(7)
        );
        Application application = ApplicationTestData.savedSent(applicationRepository, job, applicant);

        InterviewProcess process = new InterviewProcess();
        process.setJob(job);
        process = interviewProcessRepository.save(process);

        Interviewee interviewee = new Interviewee();
        interviewee.setInterviewProcess(process);
        interviewee.setApplication(application);
        interviewee.setLastInvited(Instant.parse("2025-01-01T10:00:00Z"));
        interviewee = intervieweeRepository.save(interviewee);

        InterviewSlot slot = new InterviewSlot();
        slot.setInterviewProcess(process);
        slot.setInterviewee(interviewee);
        slot.setStartDateTime(Instant.now().plusSeconds(3600));
        slot.setEndDateTime(Instant.now().plusSeconds(7200));
        slot.setLocation("Room 101");
        slot.setStreamLink("https://stream.test/slot");
        slot.setIsBooked(true);
        interviewSlotRepository.save(slot);

        byte[] zipBytes = api
            .with(JwtPostProcessors.jwtUser(applicantUser.getUserId(), "ROLE_APPLICANT"))
            .getAndReturnBytes(API_URL, Map.of(), 200, MediaType.valueOf("application/zip"));

        String summaryJson = extractSummaryJson(zipBytes);

        assertThat(summaryJson).contains("\"interviewees\"").contains("\"Interview Role\"").contains("\"lastInvited\"");
        assertThat(summaryJson).doesNotContain("\"interviewProcessId\"").doesNotContain("\"interviewSlotId\"").doesNotContain("\"jobId\"");
    }

    @Test
    void exportIncludesInterviewProcessesAndSlotsForStaff() throws Exception {
        ResearchGroup researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        User professor = UserTestData.savedProfessor(userRepository, researchGroup);

        Job job = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Staff Interview Role",
            JobState.PUBLISHED,
            LocalDate.now().plusDays(7)
        );

        InterviewProcess process = new InterviewProcess();
        process.setJob(job);
        process = interviewProcessRepository.save(process);

        InterviewSlot slot = new InterviewSlot();
        slot.setInterviewProcess(process);
        slot.setStartDateTime(Instant.now().plusSeconds(3600));
        slot.setEndDateTime(Instant.now().plusSeconds(7200));
        slot.setLocation("Room 202");
        slot.setStreamLink("https://stream.test/staff-slot");
        slot.setIsBooked(false);
        interviewSlotRepository.save(slot);

        byte[] zipBytes = api
            .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
            .getAndReturnBytes(API_URL, Map.of(), 200, MediaType.valueOf("application/zip"));

        String summaryJson = extractSummaryJson(zipBytes);

        assertThat(summaryJson)
            .contains("\"interviewProcesses\"")
            .contains("\"Staff Interview Role\"")
            .contains("\"interviewSlots\"")
            .contains("\"Room 202\"")
            .doesNotContain("\"interviewProcessId\"")
            .doesNotContain("\"interviewSlotId\"")
            .doesNotContain("\"jobId\"");
    }

    @Test
    void exportReturns500WhenUserDoesNotExist() {
        UUID missingUserId = UUID.randomUUID();

        byte[] body = api
            .with(JwtPostProcessors.jwtUser(missingUserId, "ROLE_PROFESSOR"))
            .getAndReturnBytes(API_URL, Map.of(), 500, MediaType.ALL);

        String bodyString = new String(body, StandardCharsets.UTF_8);
        assertThat(bodyString).contains("User data export failed");
    }

    private String extractSummaryJson(byte[] zipBytes) throws Exception {
        String summaryJson = null;
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if ("user_data_summary.json".equals(entry.getName())) {
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    zis.transferTo(out);
                    summaryJson = out.toString(StandardCharsets.UTF_8);
                }
                zis.closeEntry();
            }
        }
        assertThat(summaryJson).isNotNull();
        return summaryJson;
    }
}
