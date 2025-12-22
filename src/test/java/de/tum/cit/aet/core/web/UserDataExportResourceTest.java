package de.tum.cit.aet.core.web;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.AbstractResourceTest;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.DatabaseCleaner;
import de.tum.cit.aet.utility.MvcTestClient;
import de.tum.cit.aet.utility.security.JwtPostProcessors;
import de.tum.cit.aet.utility.testdata.UserTestData;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/**
 * Integration tests for {@link UserDataExportResource}.
 */
public class UserDataExportResourceTest extends AbstractResourceTest {

    private static final String API_URL = "/api/users/export";

    @Autowired
    UserRepository userRepository;

    @Autowired
    DatabaseCleaner databaseCleaner;

    @Autowired
    MvcTestClient api;

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
    void exportReturns500WhenUserDoesNotExist() {
        UUID missingUserId = UUID.randomUUID();

        byte[] body = api
            .with(JwtPostProcessors.jwtUser(missingUserId, "ROLE_PROFESSOR"))
            .getAndReturnBytes(API_URL, Map.of(), 500, MediaType.ALL);

        String bodyString = new String(body, StandardCharsets.UTF_8);
        assertThat(bodyString).contains("User data export failed");
    }
}
