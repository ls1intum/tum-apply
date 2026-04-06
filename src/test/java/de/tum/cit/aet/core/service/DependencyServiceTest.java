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
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
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
    private WebClient.RequestHeadersUriSpec<?> requestHeadersUriSpec;

    @Mock
    private WebClient.RequestHeadersSpec<?> requestHeadersSpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

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

        @Test
        void shouldParseStandardImplementationDependencies() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                """
                implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
                implementation 'org.projectlombok:lombok:1.18.30'
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(2);
            assertThat(overview.serverCount()).isEqualTo(2);
            assertThat(overview.clientCount()).isZero();

            DependencyDTO springBoot = overview.dependencies().stream().filter(d -> d.name().equals("spring-boot-starter-web")).findFirst().orElseThrow();
            assertThat(springBoot.group()).isEqualTo("org.springframework.boot");
            assertThat(springBoot.version()).isEqualTo("3.2.0");
            assertThat(springBoot.source()).isEqualTo("server");
            assertThat(springBoot.purl()).isEqualTo("pkg:maven/org.springframework.boot/spring-boot-starter-web@3.2.0");
        }

        @Test
        void shouldParseRuntimeOnlyAndCompileOnlyDependencies() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                """
                runtimeOnly 'org.postgresql:postgresql:42.7.0'
                compileOnly 'org.projectlombok:lombok:1.18.30'
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(2);
            assertThat(overview.dependencies()).extracting(DependencyDTO::name).containsExactlyInAnyOrder("postgresql", "lombok");
        }

        @Test
        void shouldSkipTestAndAnnotationProcessorDependencies() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                """
                implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
                testImplementation 'org.junit.jupiter:junit-jupiter:5.10.1'
                annotationProcessor 'org.projectlombok:lombok:1.18.30'
                developmentOnly 'org.springframework.boot:spring-boot-devtools:3.2.0'
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).name()).isEqualTo("spring-boot-starter-web");
        }

        @Test
        void shouldSkipCommentLines() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                """
                // This is a comment
                implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
        }

        @Test
        void shouldResolvePropertyPlaceholdersFromGradleProperties() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                "implementation 'org.springframework.boot:spring-boot-starter-web:${springBootVersion}'",
                StandardCharsets.UTF_8
            );
            Files.writeString(tempDir.resolve("gradle.properties"), "springBootVersion=3.2.0", StandardCharsets.UTF_8);
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).version()).isEqualTo("3.2.0");
        }

        @Test
        void shouldHandleDependencyWithoutVersion() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                "implementation 'org.springframework.boot:spring-boot-starter-web'",
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).version()).isEqualTo("managed");
        }

        @Test
        void shouldReturnEmptyListWhenBuildGradleDoesNotExist() {
            stubOsvEmptyResponse(0);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).isEmpty();
            assertThat(overview.serverCount()).isZero();
        }

        @Test
        void shouldHandleParenthesizedDependencyNotation() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                "implementation('org.springframework.boot:spring-boot-starter-web:3.2.0')",
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).name()).isEqualTo("spring-boot-starter-web");
        }
    }

    @Nested
    class ParseNpmDependencies {

        @Test
        void shouldParseRegularDependencies() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "rxjs": "~7.8.1",
                    "zone.js": "^0.14.0"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(2);
            assertThat(overview.clientCount()).isEqualTo(2);
            assertThat(overview.serverCount()).isZero();

            DependencyDTO rxjs = overview.dependencies().stream().filter(d -> d.name().equals("rxjs")).findFirst().orElseThrow();
            assertThat(rxjs.version()).isEqualTo("7.8.1");
            assertThat(rxjs.source()).isEqualTo("client");
            assertThat(rxjs.group()).isEmpty();
            assertThat(rxjs.purl()).isEqualTo("pkg:npm/rxjs@7.8.1");
        }

        @Test
        void shouldParseScopedPackages() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "@angular/core": "^18.0.0",
                    "@angular/router": "~18.0.0"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(2);

            DependencyDTO angularCore = overview.dependencies().stream().filter(d -> d.name().equals("core")).findFirst().orElseThrow();
            assertThat(angularCore.group()).isEqualTo("@angular");
            assertThat(angularCore.version()).isEqualTo("18.0.0");
            assertThat(angularCore.purl()).isEqualTo("pkg:npm/@angular/core@18.0.0");
        }

        @Test
        void shouldParseDevDependencies() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "devDependencies": {
                    "vitest": "^1.0.0"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).name()).isEqualTo("vitest");
            assertThat(overview.dependencies().get(0).source()).isEqualTo("client");
        }

        @Test
        void shouldStripVersionPrefixes() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "rxjs": "~7.8.1",
                    "zone.js": "^0.14.0"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            DependencyDTO rxjs = overview.dependencies().stream().filter(d -> d.name().equals("rxjs")).findFirst().orElseThrow();
            DependencyDTO zoneJs = overview.dependencies().stream().filter(d -> d.name().equals("zone.js")).findFirst().orElseThrow();
            assertThat(rxjs.version()).isEqualTo("7.8.1");
            assertThat(zoneJs.version()).isEqualTo("0.14.0");
        }

        @Test
        void shouldReturnEmptyListWhenPackageJsonDoesNotExist() {
            stubOsvEmptyResponse(0);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).isEmpty();
            assertThat(overview.clientCount()).isZero();
        }

        @Test
        void shouldCombineServerAndClientDependencies() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                "implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'",
                StandardCharsets.UTF_8
            );
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "rxjs": "~7.8.1"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(2);
            assertThat(overview.serverCount()).isEqualTo(1);
            assertThat(overview.clientCount()).isEqualTo(1);
        }
    }

    @Nested
    class VulnerabilityEnrichment {

        @Test
        void shouldCountVulnerabilitiesBySeverity() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "lodash": "4.17.20"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvResponseWithVulnerabilities(
                """
                {
                  "results": [{
                    "vulns": [
                      {"id": "GHSA-001", "summary": "Critical RCE", "database_specific": {"severity": "CRITICAL"}},
                      {"id": "GHSA-002", "summary": "High XSS", "database_specific": {"severity": "HIGH"}},
                      {"id": "GHSA-003", "summary": "Medium issue", "database_specific": {"severity": "MEDIUM"}}
                    ]
                  }]
                }
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.totalVulnerabilities()).isEqualTo(3);
            assertThat(overview.criticalCount()).isEqualTo(1);
            assertThat(overview.highCount()).isEqualTo(1);
            assertThat(overview.mediumCount()).isEqualTo(1);
            assertThat(overview.lowCount()).isZero();

            DependencyDTO lodash = overview.dependencies().get(0);
            assertThat(lodash.vulnerabilities()).hasSize(3);
            assertThat(lodash.vulnerabilities()).extracting(VulnerabilityDTO::id).containsExactly("GHSA-001", "GHSA-002", "GHSA-003");
        }

        @Test
        void shouldHandleDependencyWithNoVulnerabilities() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "safe-lib": "1.0.0"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvResponseWithVulnerabilities("""
                {"results": [{}]}
                """);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.totalVulnerabilities()).isZero();
            assertThat(overview.dependencies().get(0).vulnerabilities()).isEmpty();
        }

        @Test
        void shouldHandleOsvApiFailureGracefully() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "rxjs": "7.8.1"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvFailure();

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).hasSize(1);
            assertThat(overview.dependencies().get(0).vulnerabilities()).isEmpty();
            assertThat(overview.totalVulnerabilities()).isZero();
        }

        @Test
        void shouldNormalizeModerateSeverityToMedium() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "lib": "1.0.0"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvResponseWithVulnerabilities(
                """
                {
                  "results": [{
                    "vulns": [
                      {"id": "GHSA-004", "summary": "Moderate issue", "database_specific": {"severity": "MODERATE"}}
                    ]
                  }]
                }
                """
            );

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.mediumCount()).isEqualTo(1);
            assertThat(overview.dependencies().get(0).vulnerabilities().get(0).severity()).isEqualTo("MEDIUM");
        }
    }

    @Nested
    class CachingBehavior {

        @Test
        void shouldReturnCachedResultOnSubsequentGetOverviewCalls() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "rxjs": "7.8.1"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(1);

            DependenciesOverviewDTO firstCall = dependencyService.getOverview();
            DependenciesOverviewDTO secondCall = dependencyService.getOverview();

            assertThat(firstCall).isSameAs(secondCall);
        }

        @Test
        void shouldRefreshBypassCache() throws IOException {
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "rxjs": "7.8.1"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(2);

            DependenciesOverviewDTO firstCall = dependencyService.getOverview();
            DependenciesOverviewDTO refreshedCall = dependencyService.refresh();

            assertThat(firstCall).isNotSameAs(refreshedCall);
        }
    }

    @Nested
    class OverviewAggregation {

        @Test
        void shouldCorrectlyAggregateCounts() throws IOException {
            Files.writeString(
                tempDir.resolve("build.gradle"),
                """
                implementation 'org.springframework.boot:spring-boot-starter-web:3.2.0'
                implementation 'org.projectlombok:lombok:1.18.30'
                """,
                StandardCharsets.UTF_8
            );
            Files.writeString(
                tempDir.resolve("package.json"),
                """
                {
                  "dependencies": {
                    "rxjs": "7.8.1",
                    "@angular/core": "18.0.0",
                    "zone.js": "0.14.0"
                  }
                }
                """,
                StandardCharsets.UTF_8
            );
            stubOsvEmptyResponse(5);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.serverCount()).isEqualTo(2);
            assertThat(overview.clientCount()).isEqualTo(3);
            assertThat(overview.dependencies()).hasSize(5);
            assertThat(overview.totalVulnerabilities()).isZero();
            assertThat(overview.criticalCount()).isZero();
            assertThat(overview.highCount()).isZero();
            assertThat(overview.mediumCount()).isZero();
            assertThat(overview.lowCount()).isZero();
        }

        @Test
        void shouldReturnEmptyOverviewWhenNoDependencyFilesExist() {
            stubOsvEmptyResponse(0);

            DependenciesOverviewDTO overview = dependencyService.refresh();

            assertThat(overview.dependencies()).isEmpty();
            assertThat(overview.serverCount()).isZero();
            assertThat(overview.clientCount()).isZero();
            assertThat(overview.totalVulnerabilities()).isZero();
        }
    }

    // --- Helper methods for stubbing OSV WebClient responses ---

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

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn((WebClient.RequestHeadersSpec) requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just(results.toString()));
    }

    @SuppressWarnings("unchecked")
    private void stubOsvResponseWithVulnerabilities(String jsonResponse) {
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn((WebClient.RequestHeadersSpec) requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just(jsonResponse));
    }

    @SuppressWarnings("unchecked")
    private void stubOsvFailure() {
        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn((WebClient.RequestHeadersSpec) requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.error(new RuntimeException("OSV API unavailable")));
    }
}
