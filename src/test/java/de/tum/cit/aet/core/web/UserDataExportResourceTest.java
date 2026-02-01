package de.tum.cit.aet.core.web;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.core.constants.DataExportState;
import de.tum.cit.aet.core.domain.DataExportRequest;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.dto.DataExportStatusDTO;
import de.tum.cit.aet.core.repository.DataExportRequestRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.service.UserDataExportService;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.DocumentTestData;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * Integration tests for {@link UserDataExportResource}.
 */
public class UserDataExportResourceTest extends AbstractResourceTest {

    private static final String STATUS_URL = "/api/users/data-export/status";
    private static final String REQUEST_URL = "/api/users/data-export";
    private static final String DOWNLOAD_URL = "/api/users/data-export/download/%s";

    @Autowired
    UserRepository userRepository;

    @Autowired
    DataExportRequestRepository dataExportRequestRepository;

    @Autowired
    DocumentRepository documentRepository;

    @Autowired
    UserDataExportService userDataExportService;

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
        AsyncEmailSender asyncEmailSenderMock = Mockito.mock(AsyncEmailSender.class);
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

        DataExportStatusDTO status = api
            .with(JwtPostProcessors.jwtUser(user.getUserId(), "ROLE_PROFESSOR"))
            .getAndRead(STATUS_URL, Map.of(), DataExportStatusDTO.class, 200, MediaType.APPLICATION_JSON);

        assertThat(status.status()).isEqualTo(DataExportState.REQUESTED);
        assertThat(status.lastRequestedAt()).isEqualTo(savedRequest.getLastRequestedAt());
        assertThat(status.nextAllowedAt()).isEqualTo(savedRequest.getLastRequestedAt().plusDays(7));
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
