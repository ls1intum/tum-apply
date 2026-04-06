package de.tum.cit.aet.core.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import de.tum.cit.aet.core.dto.sbom.DependenciesOverviewDTO;
import de.tum.cit.aet.core.dto.sbom.DependencyDTO;
import de.tum.cit.aet.core.dto.sbom.VulnerabilityDTO;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import tools.jackson.databind.ObjectMapper;

/**
 * Unit tests for {@link DependencyService}.
 * Tests parsing of Gradle and npm dependencies, CVSS severity extraction,
 * caching behavior, and OSV vulnerability enrichment.
 */
@ExtendWith(MockitoExtension.class)
class DependencyServiceTest {

    @Mock
    private WebClient.Builder webClientBuilder;

    @Mock
    private WebClient webClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    @Mock
    private WebClient.RequestHeadersUriSpec<?> requestHeadersUriSpec;

    @Mock
    private WebClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec getResponseSpec;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private DependencyService dependencyService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        when(webClientBuilder.build()).thenReturn(webClient);
        dependencyService = new DependencyService(objectMapper, webClientBuilder, tempDir.toString());
    }

    @Nested
    class ParseGradleDependencies {

        @ParameterizedTest
        @ValueSource(strings = { "implementation", "runtimeOnly", "compileOnly" })
        void shouldParseAllSupportedDependencyConfigurations(String configuration) throws IOException {
            writeBuildGradle(configuration + " 'org.example:my-lib:1.0.0'");
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            DependencyDTO dep = overview.dependencies().get(0);
            assertThat(dep.name()).isEqualTo("my-lib");
            assertThat(dep.group()).isEqualTo("org.example");
            assertThat(dep.version()).isEqualTo("1.0.0");
            assertThat(dep.source()).isEqualTo("server");
            assertThat(dep.purl()).isEqualTo("pkg:maven/org.example/my-lib@1.0.0");
        }

        @ParameterizedTest(name = "should skip {0} lines")
        @ValueSource(
            strings = {
                "testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'",
                "annotationProcessor 'org.projectlombok:lombok:1.18.30'",
                "developmentOnly 'org.springframework.boot:spring-boot-devtools:3.2.0'",
                "// implementation 'commented:out:1.0.0'",
            }
        )
        void shouldSkipNonProductionDependencies(String line) throws IOException {
            writeBuildGradle(line + "\nimplementation 'org.example:kept:1.0.0'");
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).name()).isEqualTo("kept");
        }

        @Test
        void shouldResolvePropertyPlaceholdersFromGradleProperties() throws IOException {
            writeBuildGradle("implementation 'org.example:my-lib:${myVersion}'");
            Files.writeString(tempDir.resolve("gradle.properties"), "myVersion=2.5.0", StandardCharsets.UTF_8);
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies().get(0).version()).isEqualTo("2.5.0");
        }

        @Test
        void shouldHandleDependencyWithoutVersion() throws IOException {
            writeBuildGradle("implementation 'org.example:my-lib'");
            stubOsvEmptyResponse(1);

            assertThat(dependencyService.refresh().dependencies().get(0).version()).isEqualTo("managed");
        }

        @Test
        void shouldReturnEmptyListWhenBuildGradleDoesNotExist() {
            assertThat(dependencyService.refresh().dependencies()).isEmpty();
        }

        @Test
        void shouldHandleParenthesizedDependencyNotation() throws IOException {
            writeBuildGradle("implementation('org.example:my-lib:1.0.0')");
            stubOsvEmptyResponse(1);

            assertThat(dependencyService.refresh().dependencies()).hasSize(1);
            assertThat(dependencyService.refresh().dependencies().get(0).name()).isEqualTo("my-lib");
        }
    }

    @Nested
    class ParseNpmDependencies {

        @Test
        void shouldParseRegularAndDevDependencies() throws IOException {
            writePackageJson(
                """
                {
                  "dependencies": { "rxjs": "~7.8.1" },
                  "devDependencies": { "vitest": "^1.0.0" }
                }
                """
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(2);
            assertThat(overview.clientCount()).isEqualTo(2);
            assertThat(overview.dependencies()).allSatisfy(d -> assertThat(d.source()).isEqualTo("client"));
        }

        @ParameterizedTest(name = "should strip prefix from {0} → {1}")
        @CsvSource({ "~7.8.1, 7.8.1", "^0.14.0, 0.14.0", "1.0.0, 1.0.0" })
        void shouldStripVersionPrefixes(String raw, String expected) throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "%s" } }
                """.formatted(raw)
            );
            stubOsvEmptyResponse(1);

            assertThat(dependencyService.refresh().dependencies().get(0).version()).isEqualTo(expected);
        }

        @Test
        void shouldParseScopedPackagesIntoGroupAndName() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "@angular/core": "^18.0.0" } }
                """
            );
            stubOsvEmptyResponse(1);

            DependencyDTO dep = dependencyService.refresh().dependencies().get(0);
            assertThat(dep.group()).isEqualTo("@angular");
            assertThat(dep.name()).isEqualTo("core");
            assertThat(dep.purl()).isEqualTo("pkg:npm/@angular/core@18.0.0");
        }

        @Test
        void shouldReturnEmptyListWhenPackageJsonDoesNotExist() {
            assertThat(dependencyService.refresh().dependencies()).isEmpty();
        }

        @Test
        void shouldCombineServerAndClientDependencies() throws IOException {
            writeBuildGradle("implementation 'org.example:server-lib:1.0.0'");
            writePackageJson(
                """
                { "dependencies": { "client-lib": "1.0.0" } }
                """
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO overview = dependencyService.refresh();
            assertThat(overview.serverCount()).isEqualTo(1);
            assertThat(overview.clientCount()).isEqualTo(1);
            assertThat(overview.dependencies()).hasSize(2);
        }
    }

    @Nested
    class VulnerabilityEnrichment {

        @ParameterizedTest(name = "{0} severity should increment {0} count")
        @CsvSource({ "CRITICAL, 1, 0, 0, 0", "HIGH, 0, 1, 0, 0", "MEDIUM, 0, 0, 1, 0" })
        void shouldCountVulnerabilitiesBySeverity(String severity, int critical, int high, int medium, int low) throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-001", "summary": "test", "database_specific": {"severity": "%s"}}]}]}
                """.formatted(severity)
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.totalVulnerabilities()).isEqualTo(1);
            assertThat(overview.criticalCount()).isEqualTo(critical);
            assertThat(overview.highCount()).isEqualTo(high);
            assertThat(overview.mediumCount()).isEqualTo(medium);
            assertThat(overview.lowCount()).isEqualTo(low);
        }

        @Test
        void shouldNormalizeModerateSeverityToMedium() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-004", "database_specific": {"severity": "MODERATE"}}]}]}
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.mediumCount()).isEqualTo(1);
            assertThat(overview.dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("MEDIUM");
        }

        @Test
        void shouldHandleDependencyWithNoVulnerabilities() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "safe-lib": "1.0.0" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{}]}
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.totalVulnerabilities()).isZero();
            assertThat(overview.dependencies().get(0).vulnerabilities()).isEmpty();
        }

        @Test
        void shouldHandleOsvApiFailureGracefully() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "rxjs": "7.8.1" } }
                """
            );
            stubOsvFailure();

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).vulnerabilities()).isEmpty();
            assertThat(overview.totalVulnerabilities()).isZero();
        }

        @Test
        void shouldAttachVulnerabilityDetailsToMatchingDependency() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lodash": "4.17.20" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [
                  {"id": "GHSA-001", "summary": "RCE", "database_specific": {"severity": "CRITICAL"}},
                  {"id": "GHSA-002", "summary": "XSS", "database_specific": {"severity": "HIGH"}}
                ]}]}
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies().get(0).vulnerabilities()).hasSize(2);
            assertThat(overview.dependencies().get(0).vulnerabilities())
                .extracting(VulnerabilityDTO::id)
                .containsExactly("GHSA-001", "GHSA-002");
        }

        @Test
        void shouldExtractSeverityFromEcosystemSpecific() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-005", "affected": [{"ecosystem_specific": {"severity": "HIGH"}}]}]}]}
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.highCount()).isEqualTo(1);
            assertThat(overview.dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("HIGH");
        }

        @Test
        void shouldExtractSeverityFromNumericCvssScore() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-006", "severity": [{"score": "9.8"}]}]}]}
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.criticalCount()).isEqualTo(1);
        }

        @ParameterizedTest(name = "CVSS score {0} should map to {1}")
        @CsvSource({ "9.5, CRITICAL", "8.0, HIGH", "5.0, MEDIUM", "2.0, LOW" })
        void shouldMapNumericCvssScoreToCorrectSeverity(String score, String expectedSeverity) throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-NUM", "severity": [{"score": "%s"}]}]}]}
                """.formatted(score)
            );

            assertThat(dependencyService.refresh().dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo(expectedSeverity);
        }

        @Test
        void shouldComputeSeverityFromCvssV3Vector() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // CVSS:3.1 vector for a critical vulnerability (score ~9.8)
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-V3", "severity": [{"type": "CVSS_V3", "score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"}]}]}]}
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.criticalCount()).isEqualTo(1);
        }

        @Test
        void shouldComputeSeverityFromCvssV3VectorWithScopeChanged() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // CVSS:3.1 vector with Scope=Changed
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-V3C", "severity": [{"type": "CVSS_V3", "score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H"}]}]}]}
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.criticalCount()).isEqualTo(1);
        }

        @Test
        void shouldReturnNullForInvalidCvssV3VectorMissingScope() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // Missing S (Scope) metric → computeCvssV3BaseScore returns null → falls through to LOW
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-BAD", "severity": [{"type": "CVSS_V3", "score": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/C:H/I:H/A:H"}]}]}]}
                """
            );

            assertThat(dependencyService.refresh().dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("LOW");
        }

        @Test
        void shouldExtractSeverityFromCvssV4VectorCritical() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // CVSS v4 vector: network accessible, low complexity, no privileges, no UI, high impact → CRITICAL
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-V4C", "severity": [{"type": "CVSS_V4", "score": "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H"}]}]}]}
                """
            );

            assertThat(dependencyService.refresh().dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("CRITICAL");
        }

        @Test
        void shouldExtractSeverityFromCvssV4VectorHigh() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // High impact but requires privileges → HIGH (not CRITICAL)
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-V4H", "severity": [{"type": "CVSS_V4", "score": "CVSS:4.0/AV:N/AC:H/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H"}]}]}]}
                """
            );

            assertThat(dependencyService.refresh().dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("HIGH");
        }

        @Test
        void shouldExtractSeverityFromCvssV4VectorMedium() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // Low impact → MEDIUM
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-V4M", "severity": [{"type": "CVSS_V4", "score": "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:L/VI:N/VA:N"}]}]}]}
                """
            );

            assertThat(dependencyService.refresh().dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("MEDIUM");
        }

        @Test
        void shouldExtractSeverityFromCvssV4VectorLow() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // No impact → LOW
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-V4L", "severity": [{"type": "CVSS_V4", "score": "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:N"}]}]}]}
                """
            );

            assertThat(dependencyService.refresh().dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("LOW");
        }

        @Test
        void shouldDefaultToLowWhenNoSeveritySourceExists() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // Vulnerability with no severity data at all
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-NONE", "summary": "Unknown severity"}]}]}
                """
            );
            stubWebClientGet(Mono.just("{\"id\": \"GHSA-NONE\", \"summary\": \"Unknown severity\"}"));

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.lowCount()).isEqualTo(1);
            assertThat(overview.dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("LOW");
        }

        @Test
        void shouldFetchFullVulnerabilityWhenBatchResponseLacksSeverity() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            // Batch response has no severity → triggers fetchFullVulnerability
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-FULL", "summary": "Needs full fetch"}]}]}
                """
            );
            // Full vulnerability response has severity in database_specific
            stubWebClientGet(Mono.just("{\"id\": \"GHSA-FULL\", \"summary\": \"Full details\", \"database_specific\": {\"severity\": \"HIGH\"}}"));

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.highCount()).isEqualTo(1);
            assertThat(overview.dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("HIGH");
        }

        @Test
        void shouldHandleFullVulnerabilityFetchFailure() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-FAIL"}]}]}
                """
            );
            stubWebClientGet(Mono.error(new RuntimeException("Fetch failed")));

            DependenciesOverviewDTO overview = dependencyService.refresh();

            // Falls back to LOW when full fetch also fails
            assertThat(overview.lowCount()).isEqualTo(1);
        }

        @Test
        void shouldHandleOsvNullResponse() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            stubWebClientPost(Mono.justOrEmpty(null));

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).vulnerabilities()).isEmpty();
        }

        @Test
        void shouldIgnoreInvalidSeverityStrings() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "lib": "1.0.0" } }
                """
            );
            stubOsvResponseWithVulnerabilities(
                """
                {"results": [{"vulns": [{"id": "GHSA-INV", "database_specific": {"severity": "UNKNOWN_LEVEL"}}]}]}
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            // Invalid severity string is not recognized by normalizeSeverity → falls through to LOW
            assertThat(overview.lowCount()).isEqualTo(1);
        }
    }

    @Nested
    class CachingBehavior {

        @Test
        void shouldReturnCachedResultOnSubsequentGetOverviewCalls() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "rxjs": "7.8.1" } }
                """
            );
            stubOsvEmptyResponse(1);

            assertThat(dependencyService.getOverview()).isSameAs(dependencyService.getOverview());
        }

        @Test
        void shouldRefreshBypassCache() throws IOException {
            writePackageJson(
                """
                { "dependencies": { "rxjs": "7.8.1" } }
                """
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO first = dependencyService.getOverview();
            assertThat(first).isNotSameAs(dependencyService.refresh());
        }
    }

    @Nested
    class OverviewAggregation {

        @Test
        void shouldCorrectlyAggregateCounts() throws IOException {
            writeBuildGradle(
                """
                implementation 'org.example:a:1.0'
                implementation 'org.example:b:1.0'
                """
            );
            writePackageJson(
                """
                { "dependencies": { "x": "1.0", "y": "1.0", "z": "1.0" } }
                """
            );
            stubOsvEmptyResponse(5);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.serverCount()).isEqualTo(2);
            assertThat(overview.clientCount()).isEqualTo(3);
            assertThat(overview.dependencies()).hasSize(5);
            assertThat(overview.totalVulnerabilities()).isZero();
        }

        @Test
        void shouldReturnEmptyOverviewWhenNoDependencyFilesExist() {
            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).isEmpty();
            assertThat(overview.serverCount()).isZero();
            assertThat(overview.clientCount()).isZero();
            assertThat(overview.totalVulnerabilities()).isZero();
        }
    }

    // --- Helpers ---

    private void writeBuildGradle(String content) throws IOException {
        Files.writeString(tempDir.resolve("build.gradle"), content, StandardCharsets.UTF_8);
    }

    private void writePackageJson(String content) throws IOException {
        Files.writeString(tempDir.resolve("package.json"), content, StandardCharsets.UTF_8);
    }

    @SuppressWarnings("unchecked")
    private void stubOsvEmptyResponse(int dependencyCount) {
        if (dependencyCount == 0) {
            return;
        }
        StringBuilder results = new StringBuilder("{\"results\": [");
        for (int i = 0; i < dependencyCount; i++) {
            if (i > 0) results.append(",");
            results.append("{}");
        }
        results.append("]}");
        stubWebClientPost(Mono.just(results.toString()));
    }

    private void stubOsvResponseWithVulnerabilities(String jsonResponse) {
        stubWebClientPost(Mono.just(jsonResponse));
    }

    private void stubOsvFailure() {
        stubWebClientPost(Mono.error(new RuntimeException("OSV API unavailable")));
    }

    @SuppressWarnings("unchecked")
    private void stubWebClientPost(Mono<String> response) {
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn((WebClient.RequestHeadersSpec) requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(response);
    }

    @SuppressWarnings("unchecked")
    private void stubWebClientGet(Mono<String> response) {
        when(webClient.get()).thenReturn((WebClient.RequestHeadersUriSpec) requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(anyString())).thenReturn((WebClient.RequestHeadersSpec) requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(getResponseSpec);
        when(getResponseSpec.bodyToMono(String.class)).thenReturn(response);
    }
}
