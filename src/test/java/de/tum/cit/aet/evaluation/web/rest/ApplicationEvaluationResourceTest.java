package de.tum.cit.aet.evaluation.web.rest;

import static java.util.Map.entry;
import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.dto.OffsetPageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.evaluation.dto.AcceptDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationDetailListDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewListDTO;
import de.tum.cit.aet.evaluation.dto.RejectDTO;
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
import de.tum.cit.aet.utility.testdata.*;
import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApplicationEvaluationResourceTest extends AbstractResourceTest {

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
    DatabaseCleaner databaseCleaner;

    @Autowired
    DocumentRepository documentRepository;

    @Autowired
    DocumentDictionaryRepository documentDictionaryRepository;

    @Autowired
    MvcTestClient api;

    @Value("${aet.storage.root}")
    private String storageRootConfig;

    User professor;
    ResearchGroup researchGroup;
    User professorUnauthorized;
    ResearchGroup researchGroupUnauthorized;
    Applicant applicant;
    Job publishedJob;
    Application sentApp;
    Application inReviewApp;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();

        researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        professor = UserTestData.savedProfessor(userRepository, researchGroup);

        researchGroupUnauthorized = ResearchGroupTestData.saved(researchGroupRepository);
        professorUnauthorized = UserTestData.savedProfessor(userRepository, researchGroupUnauthorized);

        applicant = ApplicantTestData.savedWithNewUser(applicantRepository);

        publishedJob = JobTestData.saved(
            jobRepository,
            professor,
            researchGroup,
            "Published Role",
            JobState.PUBLISHED,
            LocalDate.now().plusDays(7)
        );

        sentApp = ApplicationTestData.savedSent(applicationRepository, publishedJob, applicant);
        inReviewApp = ApplicationTestData.savedInReview(applicationRepository, publishedJob, applicant);
    }

    @Nested
    class GetApplications {

        @Test
        void overviewsOnlyViewableStates() {
            ApplicationEvaluationOverviewListDTO dto = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/evaluation/applications",
                    Map.ofEntries(entry("offset", "0"), entry("limit", "10")),
                    ApplicationEvaluationOverviewListDTO.class,
                    200
                );

            assertThat(dto.applications()).extracting("applicationId").contains(sentApp.getApplicationId(), inReviewApp.getApplicationId());
        }

        @Test
        void detailsReturnsDetails() {
            ApplicationEvaluationDetailListDTO details = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/evaluation/application-details",
                    Map.of("offset", "0", "limit", "10"),
                    ApplicationEvaluationDetailListDTO.class,
                    200
                );

            assertThat(details.applications()).isNotEmpty();
        }

        @Test
        void detailsWindowValidOddSize() {
            ApplicationEvaluationDetailListDTO win = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/evaluation/application-details/window",
                    Map.ofEntries(entry("applicationId", inReviewApp.getApplicationId().toString()), entry("windowSize", "3")),
                    ApplicationEvaluationDetailListDTO.class,
                    200
                );

            assertThat(win.applications().size()).isBetween(1, 3);
        }

        @Test
        void detailsLimitIsApplied() {
            ApplicationEvaluationDetailListDTO details = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/evaluation/application-details",
                    Map.of("offset", "0", "limit", "1"),
                    ApplicationEvaluationDetailListDTO.class,
                    200
                );

            assertThat(details.applications()).hasSize(1);
        }

        @Test
        void overviewsWithSortingOk() {
            SortDTO sort = new SortDTO("appliedAt", SortDTO.Direction.DESC);
            OffsetPageDTO page = new OffsetPageDTO(0, 10);

            ApplicationEvaluationOverviewListDTO dto = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/evaluation/applications",
                    Map.of(
                        "offset",
                        String.valueOf(page.offset()),
                        "limit",
                        String.valueOf(page.limit()),
                        "sortBy",
                        sort.sortBy(),
                        "direction",
                        sort.direction().name()
                    ),
                    ApplicationEvaluationOverviewListDTO.class,
                    200
                );

            assertThat(dto.applications()).isNotEmpty();
        }
    }

    @Nested
    class AcceptApplication {

        @Test
        void sentBecomesAcceptedAndMayCloseJob() {
            AcceptDTO payload = new AcceptDTO("Accepted!", true, true);

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/accept", payload, Void.class, 204);

            Application updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
            assertThat(updated.getState()).isEqualTo(ApplicationState.ACCEPTED);

            Job job = jobRepository.findById(publishedJob.getJobId()).orElseThrow();
            assertThat(job.getState()).isEqualTo(JobState.APPLICANT_FOUND);
        }

        @Test
        void notInReviewableStateReturns400() {
            sentApp.setState(ApplicationState.ACCEPTED);
            applicationRepository.save(sentApp);

            AcceptDTO payload = new AcceptDTO("Already accepted", true, true);

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/accept", payload, Void.class, 400);

            assertThat(result).isNull();
        }

        @Test
        void nonExistingReturns404() {
            UUID randomId = UUID.randomUUID();
            AcceptDTO payload = new AcceptDTO("Not found", true, true);

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + randomId + "/accept", payload, Void.class, 404);

            assertThat(result).isNull();
        }

        @Test
        void withoutClosingJobKeepsJobOpen() {
            AcceptDTO payload = new AcceptDTO("Accepted but job open", false, false);

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/accept", payload, Void.class, 204);

            Job job = jobRepository.findById(publishedJob.getJobId()).orElseThrow();
            assertThat(job.getState()).isEqualTo(JobState.PUBLISHED);
        }

        @Test
        void withoutNotifyApplicantStillAccepts() {
            AcceptDTO payload = new AcceptDTO("Accepted silently", true, false);

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/accept", payload, Void.class, 204);

            Application updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
            assertThat(updated.getState()).isEqualTo(ApplicationState.ACCEPTED);
        }
    }

    @Nested
    class RejectApplication {

        @Test
        void inReviewBecomesRejectedAndStoresReason() {
            RejectDTO payload = new RejectDTO(RejectReason.OTHER_REASON, true);

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + inReviewApp.getApplicationId() + "/reject", payload, Void.class, 204);

            Application updated = applicationRepository.findById(inReviewApp.getApplicationId()).orElseThrow();
            assertThat(updated.getState()).isEqualTo(ApplicationState.REJECTED);
        }

        @Test
        void notInReviewableStateReturns400() {
            inReviewApp.setState(ApplicationState.ACCEPTED);
            applicationRepository.save(inReviewApp);

            RejectDTO payload = new RejectDTO(RejectReason.FAILED_REQUIREMENTS, true);

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + inReviewApp.getApplicationId() + "/reject", payload, Void.class, 400);

            assertThat(result).isNull();
        }

        @Test
        void nonExistingReturns404() {
            UUID randomId = UUID.randomUUID();
            RejectDTO payload = new RejectDTO(RejectReason.FAILED_REQUIREMENTS, true);

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + randomId + "/reject", payload, Void.class, 404);

            assertThat(result).isNull();
        }

        @Test
        void withoutNotifyApplicantStillRejects() {
            RejectDTO payload = new RejectDTO(RejectReason.FAILED_REQUIREMENTS, false);

            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead("/api/evaluation/applications/" + inReviewApp.getApplicationId() + "/reject", payload, Void.class, 204);

            Application updated = applicationRepository.findById(inReviewApp.getApplicationId()).orElseThrow();
            assertThat(updated.getState()).isEqualTo(ApplicationState.REJECTED);
        }
    }

    @Nested
    class MarkApplicationAsInReview {

        @Test
        void sentBecomesInReview() {
            api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/open", null, Void.class, 204);

            Application updated = applicationRepository.findById(sentApp.getApplicationId()).orElseThrow();
            assertThat(updated.getState()).isEqualTo(ApplicationState.IN_REVIEW);
        }

        @Test
        void nonExistingReturns404() {
            UUID randomId = UUID.randomUUID();

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead("/api/evaluation/applications/" + randomId + "/open", null, Void.class, 404);

            assertThat(result).isNull();
        }
    }

    @Nested
    class DownloadDocuments {

        @Test
        void includesAllTypes() throws Exception {
            Map<DocumentType, String> expectedFileNames = Map.of(
                DocumentType.BACHELOR_TRANSCRIPT,
                "bachelor",
                DocumentType.MASTER_TRANSCRIPT,
                "master",
                DocumentType.CV,
                "cv",
                DocumentType.REFERENCE,
                "reference",
                DocumentType.CUSTOM,
                "custom"
            );

            int i = 1;
            for (Map.Entry<DocumentType, String> entry : expectedFileNames.entrySet()) {
                DocumentTestData.savedDictionaryWithDocument(
                    storageRootConfig,
                    documentRepository,
                    documentDictionaryRepository,
                    professor,
                    sentApp,
                    applicant,
                    "/testdocs/test-doc" + i + ".pdf",
                    entry.getValue() + ".pdf",
                    entry.getKey(),
                    entry.getValue()
                );
                i++;
            }

            byte[] zipBytes = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndReturnBytes(
                    "/api/evaluation/applications/" + sentApp.getApplicationId() + "/documents-download",
                    Map.of(),
                    200,
                    MediaType.valueOf("application/zip")
                );

            assertThat(zipBytes).isNotEmpty();

            try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
                Set<String> foundEntries = new HashSet<>();
                ZipEntry entry;
                while ((entry = zis.getNextEntry()) != null) {
                    foundEntries.add(entry.getName());
                    zis.closeEntry();
                }
                assertThat(foundEntries).hasSize(expectedFileNames.size());
            }
        }

        @Test
        void multipleSameTypeAddsNumbering() throws Exception {
            DocumentTestData.savedDictionaryWithDocument(
                storageRootConfig,
                documentRepository,
                documentDictionaryRepository,
                professor,
                sentApp,
                applicant,
                "/testdocs/test-doc1.pdf",
                "cv1.pdf",
                DocumentType.CV,
                "cv"
            );
            DocumentTestData.savedDictionaryWithDocument(
                storageRootConfig,
                documentRepository,
                documentDictionaryRepository,
                professor,
                sentApp,
                applicant,
                "/testdocs/test-doc2.pdf",
                "cv2.pdf",
                DocumentType.CV,
                "cv"
            );

            byte[] zipBytes = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndReturnBytes(
                    "/api/evaluation/applications/" + sentApp.getApplicationId() + "/documents-download",
                    Map.of(),
                    200,
                    MediaType.valueOf("application/zip")
                );

            assertThat(zipBytes).isNotEmpty();
            try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
                ZipEntry first = zis.getNextEntry();
                Assertions.assertNotNull(first);
                assertThat(first.getName()).startsWith("cv_1");
                zis.closeEntry();
                ZipEntry second = zis.getNextEntry();
                Assertions.assertNotNull(second);
                assertThat(second.getName()).startsWith("cv_2");
                zis.closeEntry();
            }
        }

        @Test
        void nonExistingApplicationReturns404() {
            UUID randomId = UUID.randomUUID();

            Void result = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/evaluation/applications/" + randomId + "/documents-download", Map.of(), Void.class, 404, MediaType.ALL);

            assertThat(result).isNull();
        }
    }

    @Nested
    class GetJobNames {

        @Test
        void returnsListOfJobNames() {
            List<String> jobNames = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/evaluation/job-names", Map.of(), new TypeReference<>() {}, 200);

            assertThat(jobNames).contains(publishedJob.getTitle());
        }

        @Test
        void returnsEmptyWhenNoJobsExist() {
            jobRepository.deleteAll();

            List<String> jobNames = api
                .with(JwtPostProcessors.jwtUser(professor.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead("/api/evaluation/job-names", Map.of(), new TypeReference<>() {}, 200);

            assertThat(jobNames).isEmpty();
        }
    }

    @Nested
    class Authorization {

        @Test
        void allUnauthorizedEndpointsReturn401() {
            // accept
            Void accept = api
                .withoutPostProcessors()
                .postAndRead(
                    "/api/evaluation/applications/" + sentApp.getApplicationId() + "/accept",
                    new AcceptDTO("msg", false, false),
                    Void.class,
                    401
                );
            assertThat(accept).isNull();

            // reject
            Void reject = api
                .withoutPostProcessors()
                .postAndRead(
                    "/api/evaluation/applications/" + sentApp.getApplicationId() + "/reject",
                    new RejectDTO(RejectReason.FAILED_REQUIREMENTS, false),
                    Void.class,
                    401
                );
            assertThat(reject).isNull();

            // mark as in review
            Void mark = api
                .withoutPostProcessors()
                .putAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/open", null, Void.class, 401);
            assertThat(mark).isNull();

            // get overviews
            Void overviews = api
                .withoutPostProcessors()
                .getAndRead("/api/evaluation/applications", Map.of("offset", "0", "limit", "10"), Void.class, 401);
            assertThat(overviews).isNull();

            // get details
            Void details = api
                .withoutPostProcessors()
                .getAndRead("/api/evaluation/application-details", Map.of("offset", "0", "limit", "10"), Void.class, 401);
            assertThat(details).isNull();

            // get details window
            Void window = api
                .withoutPostProcessors()
                .getAndRead(
                    "/api/evaluation/application-details/window",
                    Map.of("applicationId", inReviewApp.getApplicationId().toString(), "windowSize", "3"),
                    Void.class,
                    401
                );
            assertThat(window).isNull();

            // get job names
            Void jobNames = api.withoutPostProcessors().getAndRead("/api/evaluation/job-names", Map.of(), Void.class, 401);
            assertThat(jobNames).isNull();

            // download documents
            Void documents = api
                .withoutPostProcessors()
                .getAndRead(
                    "/api/evaluation/applications/" + sentApp.getApplicationId() + "/documents-download",
                    Map.of(),
                    Void.class,
                    401
                );
            assertThat(documents).isNull();
        }

        @Test
        void allForbiddenEndpointsReturn403() {
            // accept
            Void accept = api
                .with(JwtPostProcessors.jwtUser(professorUnauthorized.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/evaluation/applications/" + sentApp.getApplicationId() + "/accept",
                    new AcceptDTO("msg", false, false),
                    Void.class,
                    403
                );
            assertThat(accept).isNull();

            // reject
            Void reject = api
                .with(JwtPostProcessors.jwtUser(professorUnauthorized.getUserId(), "ROLE_PROFESSOR"))
                .postAndRead(
                    "/api/evaluation/applications/" + sentApp.getApplicationId() + "/reject",
                    new RejectDTO(RejectReason.FAILED_REQUIREMENTS, false),
                    Void.class,
                    403
                );
            assertThat(reject).isNull();

            // mark as in review
            Void mark = api
                .with(JwtPostProcessors.jwtUser(professorUnauthorized.getUserId(), "ROLE_PROFESSOR"))
                .putAndRead("/api/evaluation/applications/" + sentApp.getApplicationId() + "/open", null, Void.class, 403);
            assertThat(mark).isNull();

            // download documents
            Void documents = api
                .with(JwtPostProcessors.jwtUser(professorUnauthorized.getUserId(), "ROLE_PROFESSOR"))
                .getAndRead(
                    "/api/evaluation/applications/" + sentApp.getApplicationId() + "/documents-download",
                    Map.of(),
                    Void.class,
                    403,
                    MediaType.ALL
                );
            assertThat(documents).isNull();
        }
    }
}
