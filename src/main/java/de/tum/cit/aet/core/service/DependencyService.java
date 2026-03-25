package de.tum.cit.aet.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import de.tum.cit.aet.core.dto.sbom.DependenciesOverviewDTO;
import de.tum.cit.aet.core.dto.sbom.DependencyDTO;
import de.tum.cit.aet.core.dto.sbom.VulnerabilityDTO;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Service for parsing project dependencies and scanning them for known security vulnerabilities.
 *
 * <p>Collects server-side dependencies from {@code build.gradle} (Java/Gradle) and client-side
 * dependencies from {@code package.json} (npm), then queries the
 * <a href="https://osv.dev">OSV.dev</a> vulnerability database to identify known CVEs.</p>
 *
 * <p>Results are cached for {@value #CACHE_TTL_SECONDS} seconds (24 hours) to minimize
 * external API calls. Use {@link #refresh()} to bypass the cache.</p>
 */
@Slf4j
@Service
public class DependencyService {

    private static final String OSV_API_URL = "https://api.osv.dev/v1/querybatch";

    private static final int OSV_BATCH_SIZE = 100;

    private static final long CACHE_TTL_SECONDS = 86_400;

    private static final double CVSS_CRITICAL_THRESHOLD = 9.0;

    private static final double CVSS_HIGH_THRESHOLD = 7.0;

    private static final double CVSS_MEDIUM_THRESHOLD = 4.0;

    private static final int GRADLE_GROUP_INDEX = 0;

    private static final int GRADLE_NAME_INDEX = 1;

    private static final int GRADLE_VERSION_INDEX = 2;

    private static final int GRADLE_MIN_PARTS = 2;

    private static final List<String> VALID_SEVERITIES = List.of("CRITICAL", "HIGH", "MEDIUM", "LOW");

    private static final Pattern GRADLE_DEP = Pattern.compile(
        "^\\s*(?:implementation|runtimeOnly|compileOnly)\\s*(?:\\(\\s*)?[\"']([^\"']+)[\"']"
    );

    private final ObjectMapper objectMapper;
    private final WebClient webClient;
    private final String projectDir;

    private DependenciesOverviewDTO cached;
    private Instant cacheExpiry;

    /**
     * Constructs the dependency service.
     *
     * @param objectMapper     Jackson object mapper for JSON parsing
     * @param webClientBuilder Spring WebClient builder for HTTP requests to OSV.dev
     * @param projectDir       project root directory path; falls back to the JVM working directory if empty
     */
    public DependencyService(
        ObjectMapper objectMapper,
        WebClient.Builder webClientBuilder,
        @Value("${spring.application.project-dir:}") String projectDir
    ) {
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder.build();
        this.projectDir = projectDir.isEmpty() ? System.getProperty("user.dir") : projectDir;
    }

    /**
     * Returns the cached dependencies overview if still valid, otherwise triggers a full refresh.
     *
     * <p>The cache is valid for {@value #CACHE_TTL_SECONDS} seconds after the last refresh.</p>
     *
     * @return the dependencies overview containing all dependencies and vulnerability counts
     */
    public DependenciesOverviewDTO getOverview() {
        if (cached != null && cacheExpiry != null && Instant.now().isBefore(cacheExpiry)) {
            return cached;
        }
        return refresh();
    }

    /**
     * Forces a full refresh by re-parsing all dependency files and re-querying OSV.dev
     * for vulnerability data, bypassing any cached results.
     *
     * @return a fresh dependencies overview with up-to-date vulnerability information
     */
    public DependenciesOverviewDTO refresh() {
        // 1) Collect all server and client dependencies
        List<DependencyDTO> deps = new ArrayList<>();
        deps.addAll(parseGradle());
        deps.addAll(parsePackageJson());

        // 2) Enrich each dependency with vulnerability data from OSV.dev
        deps = enrichWithVulnerabilities(deps);

        // 3) Aggregate counts by source and severity
        int serverCount = 0,
            clientCount = 0;
        int total = 0,
            critical = 0,
            high = 0,
            medium = 0,
            low = 0;

        for (DependencyDTO d : deps) {
            if ("server".equals(d.source())) serverCount++;
            else clientCount++;

            if (d.vulnerabilities() != null) {
                for (VulnerabilityDTO v : d.vulnerabilities()) {
                    total++;
                    switch (v.severity()) {
                        case "CRITICAL" -> critical++;
                        case "HIGH" -> high++;
                        case "MEDIUM" -> medium++;
                        default -> low++;
                    }
                }
            }
        }

        // 4) Cache and return the overview
        cached = new DependenciesOverviewDTO(deps, serverCount, clientCount, total, critical, high, medium, low, Instant.now().toString());
        cacheExpiry = Instant.now().plusSeconds(CACHE_TTL_SECONDS);
        return cached;
    }

    /**
     * Parses server-side (Java/Gradle) dependencies from {@code build.gradle},
     * resolving version placeholders from {@code gradle.properties}.
     *
     * @return list of server dependencies, or an empty list if {@code build.gradle} is not found
     */
    private List<DependencyDTO> parseGradle() {
        Path buildFile = Path.of(projectDir, "build.gradle");
        Path propsFile = Path.of(projectDir, "gradle.properties");
        if (!Files.exists(buildFile)) return List.of();

        try {
            // 1) Read build file and load property placeholders
            String content = Files.readString(buildFile, StandardCharsets.UTF_8);
            Map<String, String> props = loadProperties(propsFile);
            List<DependencyDTO> result = new ArrayList<>();

            // 2) Parse each line into a dependency (skipping non-dependency lines)
            for (String line : content.split("\n")) {
                DependencyDTO dep = parseGradleLine(line.trim(), props);
                if (dep != null) {
                    result.add(dep);
                }
            }
            return result;
        } catch (IOException e) {
            log.error("Failed to parse build.gradle", e);
            return List.of();
        }
    }

    private DependencyDTO parseGradleLine(String trimmed, Map<String, String> props) {
        // 1) Skip comments, test, annotation processor, and development-only lines
        if (isSkippedGradleLine(trimmed)) return null;

        // 2) Match against the dependency regex
        Matcher m = GRADLE_DEP.matcher(trimmed);
        if (!m.find()) return null;

        // 3) Resolve property placeholders and split into group:name:version
        String coord = resolveProps(m.group(1), props);
        String[] parts = coord.split(":");
        if (parts.length < GRADLE_MIN_PARTS) return null;

        // 4) Build the dependency DTO with a Maven purl
        String group = parts[GRADLE_GROUP_INDEX];
        String name = parts[GRADLE_NAME_INDEX];
        String version = parts.length > GRADLE_VERSION_INDEX ? parts[GRADLE_VERSION_INDEX] : "managed";
        String purl = "pkg:maven/" + group + "/" + name + "@" + version;

        return new DependencyDTO(name, group, version, "server", purl, List.of());
    }

    private boolean isSkippedGradleLine(String trimmed) {
        return trimmed.startsWith("//")
            || trimmed.contains("test")
            || trimmed.contains("annotationProcessor")
            || trimmed.contains("developmentOnly");
    }

    /**
     * Parses client-side (npm) dependencies from {@code package.json}.
     *
     * <p>Extracts both {@code dependencies} and {@code devDependencies} sections,
     * handling scoped packages (e.g. {@code @angular/core}) by splitting into group and name.</p>
     *
     * @return list of client dependencies, or an empty list if {@code package.json} is not found
     */
    private List<DependencyDTO> parsePackageJson() {
        Path pkgFile = Path.of(projectDir, "package.json");
        if (!Files.exists(pkgFile)) return List.of();

        try {
            JsonNode root = objectMapper.readTree(pkgFile.toFile());
            List<DependencyDTO> result = new ArrayList<>();

            addNpmDeps(root.get("dependencies"), result);
            addNpmDeps(root.get("devDependencies"), result);

            return result;
        } catch (IOException e) {
            log.error("Failed to parse package.json", e);
            return List.of();
        }
    }

    /**
     * Extracts npm dependencies from a JSON object node and adds them to the result list.
     *
     * @param node   the JSON object containing dependency name-version pairs, or {@code null}
     * @param result the list to append parsed dependencies to
     */
    private void addNpmDeps(JsonNode node, List<DependencyDTO> result) {
        if (node == null) return;
        node
            .fields()
            .forEachRemaining(entry -> {
                String fullName = entry.getKey();
                String version = entry.getValue().asText().replaceFirst("^[~^]", "");
                String group = fullName.startsWith("@") ? fullName.substring(0, fullName.indexOf('/')) : "";
                String name = fullName.startsWith("@") ? fullName.substring(fullName.indexOf('/') + 1) : fullName;
                String purl = "pkg:npm/" + (group.isEmpty() ? "" : group + "/") + name + "@" + version;
                result.add(new DependencyDTO(name, group, version, "client", purl, List.of()));
            });
    }

    /**
     * Enriches each dependency with vulnerability data from OSV.dev.
     *
     * <p>Queries the OSV batch API using each dependency's Package URL (purl).
     * Dependencies are processed in batches of {@value #OSV_BATCH_SIZE} to respect API limits.</p>
     *
     * @param deps the list of dependencies to enrich
     * @return a new list of dependencies with vulnerability information attached
     */
    private List<DependencyDTO> enrichWithVulnerabilities(List<DependencyDTO> deps) {
        List<DependencyDTO> enriched = new ArrayList<>(deps.size());
        for (int i = 0; i < deps.size(); i += OSV_BATCH_SIZE) {
            // 1) Slice the next batch of dependencies
            List<DependencyDTO> batch = deps.subList(i, Math.min(i + OSV_BATCH_SIZE, deps.size()));

            // 2) Query OSV.dev for vulnerabilities in this batch
            Map<String, List<VulnerabilityDTO>> vulnMap = queryOsv(batch);

            // 3) Attach vulnerability data to each dependency
            for (DependencyDTO dep : batch) {
                List<VulnerabilityDTO> vulns = vulnMap.getOrDefault(dep.purl(), List.of());
                enriched.add(new DependencyDTO(dep.name(), dep.group(), dep.version(), dep.source(), dep.purl(), vulns));
            }
        }
        return enriched;
    }

    /**
     * Sends a batch query to the OSV.dev API and parses the vulnerability results.
     *
     * @param batch the batch of dependencies to query
     * @return a map from Package URL to the list of vulnerabilities found for that dependency
     */
    private Map<String, List<VulnerabilityDTO>> queryOsv(List<DependencyDTO> batch) {
        Map<String, List<VulnerabilityDTO>> result = new HashMap<>();
        try {
            // 1) Send the batch request to OSV.dev
            String response = sendOsvRequest(batch);
            if (response == null) return result;

            // 2) Validate the response structure
            JsonNode results = objectMapper.readTree(response).get("results");
            if (results == null || !results.isArray()) return result;

            // 3) Parse each result entry into vulnerability DTOs
            parseOsvResults(results, batch, result);
        } catch (Exception e) {
            log.error("OSV query failed for batch of {} dependencies", batch.size(), e);
        }
        return result;
    }

    private String sendOsvRequest(List<DependencyDTO> batch) {
        ObjectNode body = objectMapper.createObjectNode();
        ArrayNode queries = body.putArray("queries");
        for (DependencyDTO dep : batch) {
            queries.addObject().putObject("package").put("purl", dep.purl());
        }

        return webClient
            .post()
            .uri(OSV_API_URL)
            .header("Content-Type", "application/json")
            .bodyValue(body.toString())
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }

    private void parseOsvResults(JsonNode results, List<DependencyDTO> batch, Map<String, List<VulnerabilityDTO>> result) {
        for (int j = 0; j < results.size() && j < batch.size(); j++) {
            JsonNode vulns = results.get(j).get("vulns");
            if (vulns == null || !vulns.isArray() || vulns.isEmpty()) continue;

            List<VulnerabilityDTO> list = new ArrayList<>();
            for (JsonNode v : vulns) {
                list.add(new VulnerabilityDTO(v.path("id").asText("UNKNOWN"), v.path("summary").asText(null), extractSeverity(v)));
            }
            result.put(batch.get(j).purl(), list);
        }
    }

    /**
     * Extracts the severity level from an OSV vulnerability entry by trying
     * CVSS scores, {@code database_specific}, and {@code ecosystem_specific} fields in order.
     *
     * @param vuln the OSV vulnerability JSON node
     * @return the severity string: one of "CRITICAL", "HIGH", "MEDIUM", or "LOW"
     */
    private String extractSeverity(JsonNode vuln) {
        // 1) Try CVSS numeric score or vector string from the severity array
        String severity = severityFromCvss(vuln);
        if (severity != null) return severity;

        // 2) Fall back to database_specific.severity (e.g. GitHub advisories)
        severity = severityFromDatabaseSpecific(vuln);
        if (severity != null) return severity;

        // 3) Fall back to affected[].ecosystem_specific.severity
        severity = severityFromEcosystemSpecific(vuln);
        if (severity != null) return severity;

        // 4) Default to LOW if no severity source is available
        return "LOW";
    }

    private String severityFromCvss(JsonNode vuln) {
        JsonNode sev = vuln.get("severity");
        if (sev == null || !sev.isArray()) return null;

        for (JsonNode s : sev) {
            String score = s.path("score").asText("");
            Double numericScore = parseDouble(score);
            if (numericScore != null) return cvssToSeverity(numericScore);

            if (s.path("type").asText("").startsWith("CVSS")) {
                Double baseScore = computeCvssV3BaseScore(score);
                if (baseScore != null) return cvssToSeverity(baseScore);
            }
        }
        return null;
    }

    private String severityFromDatabaseSpecific(JsonNode vuln) {
        JsonNode db = vuln.get("database_specific");
        if (db == null || !db.has("severity")) return null;
        return normalizeSeverity(db.get("severity").asText(""));
    }

    private String severityFromEcosystemSpecific(JsonNode vuln) {
        JsonNode affected = vuln.get("affected");
        if (affected == null || !affected.isArray()) return null;

        for (JsonNode a : affected) {
            JsonNode eco = a.get("ecosystem_specific");
            if (eco != null && eco.has("severity")) {
                String result = normalizeSeverity(eco.get("severity").asText(""));
                if (result != null) return result;
            }
        }
        return null;
    }

    private String normalizeSeverity(String raw) {
        String upper = raw.toUpperCase();
        if ("MODERATE".equals(upper)) return "MEDIUM";
        return VALID_SEVERITIES.contains(upper) ? upper : null;
    }

    /**
     * Computes the CVSS v3.x base score from a vector string using the standard formula.
     *
     * @param vector the CVSS vector string (e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")
     * @return the computed base score (0.0–10.0), or {@code null} if the vector is not a valid CVSS v3 string
     * @see <a href="https://www.first.org/cvss/v3.1/specification-document">CVSS v3.1 Specification</a>
     */
    private Double computeCvssV3BaseScore(String vector) {
        if (vector == null || !vector.startsWith("CVSS:3")) return null;

        // 1) Parse vector segments into a key-value map (e.g. "AV" -> "N")
        Map<String, String> metrics = new HashMap<>();
        for (String segment : vector.split("/")) {
            int colon = segment.indexOf(':');
            if (colon > 0 && colon < segment.length() - 1) {
                metrics.put(segment.substring(0, colon), segment.substring(colon + 1));
            }
        }

        String s = metrics.get("S");
        if (s == null) return null;
        boolean scopeChanged = "C".equals(s);

        // 2) Map each metric to its numeric weight per the CVSS v3.1 spec
        Double av = switch (metrics.getOrDefault("AV", "")) {
            case "N" -> 0.85; case "A" -> 0.62; case "L" -> 0.55; case "P" -> 0.20; default -> null;
        };
        Double ac = switch (metrics.getOrDefault("AC", "")) {
            case "L" -> 0.77; case "H" -> 0.44; default -> null;
        };
        Double pr = switch (metrics.getOrDefault("PR", "")) {
            case "N" -> 0.85;
            case "L" -> scopeChanged ? 0.68 : 0.62;
            case "H" -> scopeChanged ? 0.50 : 0.27;
            default -> null;
        };
        Double ui = switch (metrics.getOrDefault("UI", "")) {
            case "N" -> 0.85; case "R" -> 0.62; default -> null;
        };
        Double c = switch (metrics.getOrDefault("C", "")) {
            case "H" -> 0.56; case "L" -> 0.22; case "N" -> 0.0; default -> null;
        };
        Double i = switch (metrics.getOrDefault("I", "")) {
            case "H" -> 0.56; case "L" -> 0.22; case "N" -> 0.0; default -> null;
        };
        Double a = switch (metrics.getOrDefault("A", "")) {
            case "H" -> 0.56; case "L" -> 0.22; case "N" -> 0.0; default -> null;
        };

        if (av == null || ac == null || pr == null || ui == null || c == null || i == null || a == null) return null;

        // 3) Compute Impact Sub-Score (ISS) and Impact
        double iss = 1 - ((1 - c) * (1 - i) * (1 - a));
        double impact = scopeChanged
            ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
            : 6.42 * iss;

        if (impact <= 0) return 0.0;

        // 4) Compute Exploitability and final base score with Roundup
        double exploitability = 8.22 * av * ac * pr * ui;
        double raw = scopeChanged
            ? 1.08 * (impact + exploitability)
            : impact + exploitability;

        return Math.ceil(Math.min(raw, 10.0) * 10) / 10.0;
    }

    /**
     * Maps a numeric CVSS score to a severity label.
     *
     * @param score the CVSS score (0.0 - 10.0)
     * @return "CRITICAL" if &ge; {@value #CVSS_CRITICAL_THRESHOLD},
     *         "HIGH" if &ge; {@value #CVSS_HIGH_THRESHOLD},
     *         "MEDIUM" if &ge; {@value #CVSS_MEDIUM_THRESHOLD},
     *         otherwise "LOW"
     */
    private String cvssToSeverity(double score) {
        if (score >= CVSS_CRITICAL_THRESHOLD) return "CRITICAL";
        if (score >= CVSS_HIGH_THRESHOLD) return "HIGH";
        if (score >= CVSS_MEDIUM_THRESHOLD) return "MEDIUM";
        return "LOW";
    }

    /**
     * Safely parses a string to a {@link Double}.
     *
     * @param s the string to parse
     * @return the parsed value, or {@code null} if the string is not a valid number
     */
    private Double parseDouble(String s) {
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Resolves Gradle property placeholders (e.g. {@code ${springBootVersion}}) in a dependency
     * coordinate string using the provided properties map.
     *
     * @param input the coordinate string potentially containing {@code ${...}} placeholders
     * @param props the properties map loaded from {@code gradle.properties}
     * @return the coordinate string with all resolvable placeholders replaced
     */
    private String resolveProps(String input, Map<String, String> props) {
        Pattern p = Pattern.compile("\\$\\{([^}]+)}");
        Matcher m = p.matcher(input);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            m.appendReplacement(sb, Matcher.quoteReplacement(props.getOrDefault(m.group(1), m.group(0))));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    /**
     * Loads key-value properties from a file, skipping comments and blank lines.
     *
     * @param path the path to the properties file
     * @return a map of property keys to values, or an empty map if the file does not exist
     */
    private Map<String, String> loadProperties(Path path) {
        Map<String, String> props = new HashMap<>();
        if (!Files.exists(path)) return props;
        try {
            for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
                String t = line.trim();
                if (t.startsWith("#") || !t.contains("=")) continue;
                int idx = t.indexOf('=');
                props.put(t.substring(0, idx).trim(), t.substring(idx + 1).trim());
            }
        } catch (IOException e) {
            log.warn("Failed to read {}", path, e);
        }
        return props;
    }
}
