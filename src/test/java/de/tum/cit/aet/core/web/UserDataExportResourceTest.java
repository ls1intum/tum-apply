package de.tum.cit.aet.core.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.core.constants.DataExportState;
import de.tum.cit.aet.core.domain.DataExportRequest;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.export.ExportedUserData;
import de.tum.cit.aet.core.domain.export.UserDataExportProviderType;
import de.tum.cit.aet.core.dto.DataExportStatusDTO;
import de.tum.cit.aet.core.repository.DataExportRequestRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.service.UserDataExportService;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.ApplicantTestData;
import de.tum.cit.aet.utility.testdata.DocumentTestData;
import de.tum.cit.aet.utility.testdata.JobTestData;
import de.tum.cit.aet.utility.testdata.ResearchGroupTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for {@link UserDataExportResource}.
 */
public class UserDataExportResourceTest extends AbstractResourceTest {

    private static final String STATUS_URL = "/api/users/data-export/status";
    private static final String REQUEST_URL = "/api/users/data-export";
    private static final String DOWNLOAD_URL = "/api/users/data-export/download/%s";
    private static final String ENTITY_BASE_PACKAGE = "de.tum.cit.aet";

    @Autowired
    UserRepository userRepository;

    @Autowired
    DataExportRequestRepository dataExportRequestRepository;

    @Autowired
    ApplicantRepository applicantRepository;

    @Autowired
    DocumentRepository documentRepository;

    @Autowired
    ResearchGroupRepository researchGroupRepository;

    @Autowired
    JobRepository jobRepository;

    @Autowired
    UserDataExportService userDataExportService;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

    @Value("${aet.storage.root}")
    private String storageRootConfig;

    @Value("${aet.data-export.root}")
    private String exportRootConfig;

    @BeforeEach
    void setup() {
        databaseCleaner.clean();
        api.withoutPostProcessors();
        AsyncEmailSender asyncEmailSenderMock = mock(AsyncEmailSender.class);
        ReflectionTestUtils.setField(userDataExportService, "sender", asyncEmailSenderMock);
        cleanExportRoot();
    }

    @Test
    void statusRequiresAuthentication() {
        api.getAndReturnBytes(STATUS_URL, Map.of(), 401, MediaType.ALL);
    }

    @Test
    void requestRequiresAuthentication() {
        api.postAndRead(REQUEST_URL, Map.of(), Void.class, 401, MediaType.ALL);
    }

    @Test
    void statusReflectsCooldownAndLatestRequest() {
        User user = savedUser("status-user@tum.de");

        LocalDateTime lastRequested = LocalDateTime.now(ZoneOffset.UTC).minusDays(1);
        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.REQUESTED);
        request.setLastRequestedAt(lastRequested);
        DataExportRequest savedRequest = dataExportRequestRepository.saveAndFlush(request);
        DataExportRequest reloadedRequest = dataExportRequestRepository.findById(savedRequest.getExportRequestId()).orElseThrow();

        DataExportStatusDTO status = api
            .with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(STATUS_URL, Map.of(), DataExportStatusDTO.class, 200, MediaType.APPLICATION_JSON);

        assertThat(status.status()).isEqualTo(DataExportState.REQUESTED);
        assertThat(status.lastRequestedAt()).isEqualTo(reloadedRequest.getLastRequestedAt());
        assertThat(status.nextAllowedAt()).isEqualTo(reloadedRequest.getLastRequestedAt().plusDays(7));
        assertThat(status.cooldownSeconds()).isGreaterThan(0);
    }

    @Test
    void requestCreatesPendingExport() {
        User user = savedUser("request-user@tum.de");

        api
            .with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(REQUEST_URL, Map.of(), Void.class, 202, MediaType.APPLICATION_JSON);

        DataExportRequest latest = dataExportRequestRepository.findTop1ByUserUserIdOrderByCreatedAtDesc(user.getUserId()).orElseThrow();

        assertThat(latest.getStatus()).isEqualTo(DataExportState.REQUESTED);
        assertThat(latest.getLastRequestedAt()).isNotNull();
    }

    @Test
    void requestRejectsWhenActiveExists() {
        User user = savedUser("active-request@tum.de");

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.REQUESTED);
        request.setLastRequestedAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(8));
        dataExportRequestRepository.saveAndFlush(request);

        api
            .with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(REQUEST_URL, Map.of(), Void.class, 409, MediaType.APPLICATION_JSON);
    }

    @Test
    void requestRejectsWhenRateLimited() {
        User user = savedUser("rate-limit@tum.de");

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.DOWNLOADED);
        request.setLastRequestedAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(2));
        dataExportRequestRepository.saveAndFlush(request);

        api
            .with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"))
            .postAndRead(REQUEST_URL, Map.of(), Void.class, 429, MediaType.APPLICATION_JSON);
    }

    @Test
    void pendingExportIsProcessedAndZipCreated() throws Exception {
        User user = savedUser("process-export@tum.de");

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.REQUESTED);
        request.setLastRequestedAt(LocalDateTime.now(ZoneOffset.UTC));
        request = dataExportRequestRepository.saveAndFlush(request);

        userDataExportService.processPendingDataExports();

        DataExportRequest updated = dataExportRequestRepository.findById(request.getExportRequestId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(DataExportState.EMAIL_SENT);
        assertThat(updated.getFilePath()).startsWith(exportRootConfig);
        assertThat(updated.getDownloadToken()).matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");

        Path zipPath = Paths.get(updated.getFilePath());
        assertThat(Files.exists(zipPath)).isTrue();

        Set<String> entries = readZipEntries(zipPath);
        assertThat(entries).contains("data_export_summary.json");
    }

    @Test
    void downloadRequiresAuthenticationAndUpdatesStatus() throws Exception {
        User user = savedUser("download-user@tum.de");

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.REQUESTED);
        request.setLastRequestedAt(LocalDateTime.now(ZoneOffset.UTC));
        request = dataExportRequestRepository.saveAndFlush(request);

        userDataExportService.processPendingDataExports();

        DataExportRequest ready = dataExportRequestRepository.findById(request.getExportRequestId()).orElseThrow();
        String url = String.format(DOWNLOAD_URL, ready.getDownloadToken());

        MockHttpServletResponse response = api
            .with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"))
            .getAndReturnResponse(url, Map.of(), 200, MediaType.valueOf("application/zip"));

        assertThat(response.getContentType()).isEqualTo("application/zip");
        assertThat(response.getHeader("Content-Disposition")).isNotNull().contains("attachment");

        DataExportRequest downloaded = dataExportRequestRepository.findById(request.getExportRequestId()).orElseThrow();
        assertThat(downloaded.getStatus()).isEqualTo(DataExportState.DOWNLOADED);
    }

    @Test
    void downloadRejectsInvalidToken() {
        User user = savedUser("invalid-token@tum.de");
        String url = String.format(DOWNLOAD_URL, UUID.randomUUID());
        api.with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR")).getAndReturnBytes(url, Map.of(), 404, MediaType.ALL);
    }

    @Test
    void downloadRejectsExpiredToken() {
        User user = savedUser("expired-token@tum.de");

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.EMAIL_SENT);
        request.setDownloadToken(UUID.randomUUID().toString());
        request.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).minusDays(1));
        request.setFilePath("/tmp/nonexistent.zip");
        dataExportRequestRepository.saveAndFlush(request);

        String url = String.format(DOWNLOAD_URL, request.getDownloadToken());
        api.with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR")).getAndReturnBytes(url, Map.of(), 409, MediaType.ALL);
    }

    @Test
    void downloadRejectsNotReadyStatus() {
        User user = savedUser("not-ready@tum.de");

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.REQUESTED);
        request.setDownloadToken(UUID.randomUUID().toString());
        request.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
        request.setFilePath("/tmp/nonexistent.zip");
        dataExportRequestRepository.saveAndFlush(request);

        String url = String.format(DOWNLOAD_URL, request.getDownloadToken());
        api.with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR")).getAndReturnBytes(url, Map.of(), 409, MediaType.ALL);
    }

    @Test
    void downloadRejectsMissingFile() {
        User user = savedUser("missing-file@tum.de");

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.EMAIL_SENT);
        request.setDownloadToken(UUID.randomUUID().toString());
        request.setExpiresAt(LocalDateTime.now(ZoneOffset.UTC).plusDays(1));
        request.setFilePath("/tmp/does-not-exist.zip");
        dataExportRequestRepository.saveAndFlush(request);

        String url = String.format(DOWNLOAD_URL, request.getDownloadToken());
        api.with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR")).getAndReturnBytes(url, Map.of(), 500, MediaType.ALL);
    }

    @Test
    void exportIncludesUploadedDocumentsWithPdfExtension() throws Exception {
        User user = savedUser("documents-user@tum.de");

        Document document = DocumentTestData.savedDocument(
            storageRootConfig,
            documentRepository,
            user,
            "/testdocs/test-doc1.pdf",
            "export-test-doc1.pdf"
        );

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.REQUESTED);
        request.setLastRequestedAt(LocalDateTime.now(ZoneOffset.UTC));
        request = dataExportRequestRepository.saveAndFlush(request);

        userDataExportService.processPendingDataExports();

        DataExportRequest updated = dataExportRequestRepository.findById(request.getExportRequestId()).orElseThrow();
        Set<String> entries = readZipEntries(Paths.get(updated.getFilePath()));

        String expectedEntry = "documents/uploaded/" + document.getDocumentId() + ".pdf";
        assertThat(entries).contains(expectedEntry);
    }

    @Test
    @Transactional
    void exportIncludesApplicantDataWhenApplicantRoleExists() throws Exception {
        User user = savedUser("applicant-export@tum.de");
        ApplicantTestData.attachApplicantRole(user);
        user = userRepository.saveAndFlush(user);

        Applicant applicant = new Applicant();
        applicant.setUser(user);
        applicant.setStreet("Teststr. 1");
        applicant.setPostalCode("12345");
        applicant.setCity("Munich");
        applicant.setCountry("de");
        applicantRepository.saveAndFlush(applicant);

        JsonNode summary = processExportAndReadSummary(user);

        assertThat(summary.has("profile")).isTrue();
        assertThat(summary.has("applicantData")).isTrue();
        assertThat(summary.has("staffData")).isFalse();
        assertThat(summary.path("applicantData").path("city").asText()).isEqualTo("Munich");
    }

    @Test
    void exportIncludesStaffDataWhenStaffRoleExists() throws Exception {
        var researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        User user = UserTestData.savedProfessor(userRepository, researchGroup);
        JobTestData.saved(jobRepository, user, researchGroup, "Staff Export Job", JobState.DRAFT, LocalDate.now());

        JsonNode summary = processExportAndReadSummary(user);

        assertThat(summary.has("profile")).isTrue();
        assertThat(summary.has("staffData")).isTrue();
        assertThat(summary.has("applicantData")).isFalse();
        assertThat(summary.path("staffData").path("supervisedJobs").toString()).contains("Staff Export Job");
    }

    @Test
    void annotatedEntitiesMustHaveRuntimeJsonCoverage() throws Exception {
        JsonNode settingsSummary = processExportAndReadSummary(savedUser("settings-coverage@tum.de"));

        Applicant applicant = ApplicantTestData.savedWithNewUser(applicantRepository);
        User applicantUser = applicant.getUser();
        JsonNode applicantSummary = processExportAndReadSummary(applicantUser);

        var researchGroup = ResearchGroupTestData.saved(researchGroupRepository);
        User staffUser = UserTestData.savedProfessor(userRepository, researchGroup);
        staffUser = userRepository.findById(staffUser.getUserId()).orElseThrow();
        JobTestData.saved(jobRepository, staffUser, researchGroup, "Coverage Job", JobState.DRAFT, LocalDate.now());
        JsonNode staffSummary = processExportAndReadSummary(staffUser);

        Map<UserDataExportProviderType, JsonNode> summaryByProviderType = new EnumMap<>(UserDataExportProviderType.class);
        summaryByProviderType.put(UserDataExportProviderType.USER_SETTINGS, settingsSummary);
        summaryByProviderType.put(UserDataExportProviderType.APPLICANT, applicantSummary);
        summaryByProviderType.put(UserDataExportProviderType.STAFF, staffSummary);

        Map<String, String> expectedJsonPathByEntity = expectedJsonPathByEntityClassName();
        List<Class<?>> annotatedEntities = findExportAnnotatedEntities();

        Set<String> discoveredClassNames = annotatedEntities.stream().map(Class::getName).collect(Collectors.toSet());
        assertThat(expectedJsonPathByEntity.keySet())
            .as("Every @ExportedUserData entity must have an explicit runtime JSON coverage mapping")
            .isEqualTo(discoveredClassNames);

        for (Class<?> entityClass : annotatedEntities) {
            ExportedUserData annotation = entityClass.getAnnotation(ExportedUserData.class);
            assertThat(annotation).isNotNull();

            String jsonPath = expectedJsonPathByEntity.get(entityClass.getName());
            JsonNode summary = summaryByProviderType.get(annotation.by());

            assertThat(summary).as("Missing runtime summary for provider type %s", annotation.by()).isNotNull();

            assertJsonPathExists(summary, jsonPath, entityClass.getName());
        }
    }

    private Map<String, String> expectedJsonPathByEntityClassName() {
        Map<String, String> pathByEntity = new HashMap<>();
        pathByEntity.put("de.tum.cit.aet.usermanagement.domain.User", "profile.email");
        pathByEntity.put("de.tum.cit.aet.usermanagement.domain.UserSetting", "settings");
        pathByEntity.put("de.tum.cit.aet.notification.domain.EmailSetting", "emailSettings");

        pathByEntity.put("de.tum.cit.aet.usermanagement.domain.Applicant", "applicantData.city");
        pathByEntity.put("de.tum.cit.aet.core.domain.DocumentDictionary", "applicantData.documents");
        pathByEntity.put("de.tum.cit.aet.application.domain.Application", "applicantData.applications");
        pathByEntity.put("de.tum.cit.aet.interview.domain.Interviewee", "applicantData.interviewees");

        pathByEntity.put("de.tum.cit.aet.job.domain.Job", "staffData.supervisedJobs");
        pathByEntity.put("de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole", "staffData.researchGroupRoles");
        pathByEntity.put("de.tum.cit.aet.evaluation.domain.ApplicationReview", "staffData.reviews");
        pathByEntity.put("de.tum.cit.aet.evaluation.domain.InternalComment", "staffData.comments");
        pathByEntity.put("de.tum.cit.aet.evaluation.domain.Rating", "staffData.ratings");
        pathByEntity.put("de.tum.cit.aet.interview.domain.InterviewProcess", "staffData.interviewProcesses");
        pathByEntity.put("de.tum.cit.aet.interview.domain.InterviewSlot", "staffData.interviewSlots");
        return pathByEntity;
    }

    // ---------------- Helper methods for test setup and assertions ----------------

    private List<Class<?>> findExportAnnotatedEntities() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(ExportedUserData.class));

        return scanner
            .findCandidateComponents(ENTITY_BASE_PACKAGE)
            .stream()
            .map(BeanDefinition::getBeanClassName)
            .filter(Objects::nonNull)
            .map(this::loadClass)
            .map(clazz -> (Class<?>) clazz)
            .collect(Collectors.toList());
    }

    private Class<?> loadClass(String className) {
        try {
            return Class.forName(className);
        } catch (ClassNotFoundException e) {
            throw new IllegalStateException("Could not load class " + className, e);
        }
    }

    private void assertJsonPathExists(JsonNode root, String dotPath, String entityClassName) {
        JsonNode current = root;
        for (String segment : dotPath.split("\\.")) {
            current = current.path(segment);
        }

        assertThat(current.isMissingNode())
            .as("Expected JSON path '%s' for entity %s to exist in export summary", dotPath, entityClassName)
            .isFalse();
    }

    private User savedUser(String email) {
        User user = UserTestData.newUser();
        user.setEmail(email);
        user.setSelectedLanguage("en");
        return userRepository.saveAndFlush(user);
    }

    private void cleanExportRoot() {
        Path root = Paths.get(exportRootConfig).toAbsolutePath().normalize();
        if (Files.exists(root)) {
            try (var stream = Files.walk(root)) {
                stream
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (Exception ignored) {
                            // best-effort cleanup
                        }
                    });
            } catch (Exception ignored) {
                // best-effort cleanup
            }
        }
        try {
            Files.createDirectories(root);
        } catch (Exception ignored) {
            // best-effort cleanup
        }
    }

    private Set<String> readZipEntries(Path zipPath) throws Exception {
        Set<String> entries = new HashSet<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(Files.readAllBytes(zipPath)))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                entries.add(entry.getName());
                zis.closeEntry();
            }
        }
        return entries;
    }

    private JsonNode processExportAndReadSummary(User user) throws Exception {
        User managedUser = userRepository.findById(user.getUserId()).orElseThrow();

        DataExportRequest request = new DataExportRequest();
        request.setUser(managedUser);
        request.setStatus(DataExportState.REQUESTED);
        request.setLastRequestedAt(LocalDateTime.now(ZoneOffset.UTC));
        request = dataExportRequestRepository.saveAndFlush(request);

        userDataExportService.processPendingDataExports();

        DataExportRequest updated = dataExportRequestRepository.findById(request.getExportRequestId()).orElseThrow();
        Path zipPath = Paths.get(updated.getFilePath());
        return readJsonNodeFromZip(zipPath, "data_export_summary.json");
    }

    private JsonNode readJsonNodeFromZip(Path zipPath, String entryName) throws Exception {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(Files.readAllBytes(zipPath)))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entryName.equals(entry.getName())) {
                    byte[] payload = zis.readAllBytes();
                    return objectMapper.readTree(payload);
                }
                zis.closeEntry();
            }
        }
        throw new IllegalStateException("Zip entry not found: " + entryName);
    }
}
