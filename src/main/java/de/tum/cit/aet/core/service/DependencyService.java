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

    private static final double CVSS_MIN_SCORE = 0.0;

    private static final double CVSS_MAX_SCORE = 10.0;

    private static final int GRADLE_GROUP_INDEX = 0;

    private static final int GRADLE_NAME_INDEX = 1;

    private static final int GRADLE_VERSION_INDEX = 2;

    private static final int GRADLE_MIN_PARTS = 2;

    private static final List<String> VALID_SEVERITIES = List.of("CRITICAL", "HIGH", "MEDIUM", "LOW");

    private static final Pattern GRADLE_DEP = Pattern.compile(
        "^\\s*(?:implementation|runtimeOnly|compileOnly)\\s+[\"'(]?[\"']([^\"']+)[\"']"
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
        List<DependencyDTO> deps = new ArrayList<>();
        deps.addAll(parseGradle());
        deps.addAll(parsePackageJson());

        deps = enrichWithVulnerabilities(deps);

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

        cached = new DependenciesOverviewDTO(deps, serverCount, clientCount, total, critical, high, medium, low, Instant.now().toString());
        cacheExpiry = Instant.now().plusSeconds(CACHE_TTL_SECONDS);
        return cached;
    }

    /**
     * Parses server-side (Java/Gradle) dependencies from {@code build.gradle}.
     *
     * <p>Extracts {@code implementation}, {@code runtimeOnly}, and {@code compileOnly} dependencies,
     * resolving version placeholders from {@code gradle.properties}. Test, annotation processor,
     * and development-only dependencies are excluded.</p>
     *
     * @return list of server dependencies, or an empty list if {@code build.gradle} is not found
     */
    private List<DependencyDTO> parseGradle() {
        Path buildFile = Path.of(projectDir, "build.gradle");
        Path propsFile = Path.of(projectDir, "gradle.properties");
        if (!Files.exists(buildFile)) return List.of();

        try {
            String content = Files.readString(buildFile, StandardCharsets.UTF_8);
            Map<String, String> props = loadProperties(propsFile);
            List<DependencyDTO> result = new ArrayList<>();

            for (String line : content.split("\n")) {
                String trimmed = line.trim();
                if (
                    trimmed.startsWith("//") ||
                    trimmed.contains("test") ||
                    trimmed.contains("annotationProcessor") ||
                    trimmed.contains("developmentOnly")
                ) {
                    continue;
                }

                Matcher m = GRADLE_DEP.matcher(trimmed);
                if (!m.find()) continue;

                String coord = resolveProps(m.group(1), props);
                String[] parts = coord.split(":");
                if (parts.length < GRADLE_MIN_PARTS) continue;

                String group = parts[GRADLE_GROUP_INDEX];
                String name = parts[GRADLE_NAME_INDEX];
                String version = parts.length > GRADLE_VERSION_INDEX ? parts[GRADLE_VERSION_INDEX] : "managed";
                String purl = "pkg:maven/" + group + "/" + name + "@" + version;

                result.add(new DependencyDTO(name, group, version, "server", purl, List.of()));
            }
            return result;
        } catch (IOException e) {
            log.error("Failed to parse build.gradle", e);
            return List.of();
        }
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
            List<DependencyDTO> batch = deps.subList(i, Math.min(i + OSV_BATCH_SIZE, deps.size()));
            Map<String, List<VulnerabilityDTO>> vulnMap = queryOsv(batch);

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
            ObjectNode body = objectMapper.createObjectNode();
            ArrayNode queries = body.putArray("queries");
            for (DependencyDTO dep : batch) {
                ObjectNode q = queries.addObject();
                q.putObject("package").put("purl", dep.purl());
            }

            String response = webClient
                .post()
                .uri(OSV_API_URL)
                .header("Content-Type", "application/json")
                .bodyValue(body.toString())
                .retrieve()
                .bodyToMono(String.class)
                .block();

            if (response == null) return result;

            JsonNode results = objectMapper.readTree(response).get("results");
            if (results == null || !results.isArray()) return result;

            for (int j = 0; j < results.size() && j < batch.size(); j++) {
                JsonNode vulns = results.get(j).get("vulns");
                if (vulns == null || !vulns.isArray() || vulns.isEmpty()) continue;

                List<VulnerabilityDTO> list = new ArrayList<>();
                for (JsonNode v : vulns) {
                    list.add(new VulnerabilityDTO(v.path("id").asText("UNKNOWN"), v.path("summary").asText(null), extractSeverity(v)));
                }
                result.put(batch.get(j).purl(), list);
            }
        } catch (Exception e) {
            log.error("OSV query failed for batch of {} dependencies", batch.size(), e);
        }
        return result;
    }

    /**
     * Extracts the severity level from an OSV vulnerability entry.
     *
     * <p>Tries the following sources in order:</p>
     * <ol>
     *   <li>CVSS numeric score from the {@code severity} array</li>
     *   <li>CVSS vector string from the {@code severity} array</li>
     *   <li>{@code database_specific.severity} field (handles GitHub's "MODERATE" as "MEDIUM")</li>
     *   <li>{@code affected[].ecosystem_specific.severity} field</li>
     * </ol>
     *
     * @param vuln the OSV vulnerability JSON node
     * @return the severity string: one of "CRITICAL", "HIGH", "MEDIUM", or "LOW"
     */
    private String extractSeverity(JsonNode vuln) {
        JsonNode sev = vuln.get("severity");
        if (sev != null && sev.isArray()) {
            for (JsonNode s : sev) {
                String score = s.path("score").asText("");
                Double numericScore = parseDouble(score);
                if (numericScore != null) {
                    return cvssToSeverity(numericScore);
                }
                String type = s.path("type").asText("");
                if (type.startsWith("CVSS")) {
                    Double baseScore = extractCvssBaseScore(score);
                    if (baseScore != null) {
                        return cvssToSeverity(baseScore);
                    }
                }
            }
        }

        JsonNode db = vuln.get("database_specific");
        if (db != null && db.has("severity")) {
            String dbSev = db.get("severity").asText("").toUpperCase();
            if ("MODERATE".equals(dbSev)) return "MEDIUM";
            if (VALID_SEVERITIES.contains(dbSev)) return dbSev;
        }

        JsonNode affected = vuln.get("affected");
        if (affected != null && affected.isArray()) {
            for (JsonNode a : affected) {
                JsonNode eco = a.get("ecosystem_specific");
                if (eco != null && eco.has("severity")) {
                    String ecoSev = eco.get("severity").asText("").toUpperCase();
                    if ("MODERATE".equals(ecoSev)) return "MEDIUM";
                    if (VALID_SEVERITIES.contains(ecoSev)) return ecoSev;
                }
            }
        }

        return "LOW";
    }

    /**
     * Attempts to extract a numeric CVSS base score from a CVSS vector string.
     *
     * <p>Splits the vector by {@code /} and looks for a segment that parses as a
     * valid CVSS score between {@value #CVSS_MIN_SCORE} and {@value #CVSS_MAX_SCORE}.</p>
     *
     * @param vector the CVSS vector string (e.g. "CVSS:3.1/AV:N/AC:L/...")
     * @return the extracted base score, or {@code null} if no valid score is found
     */
    private Double extractCvssBaseScore(String vector) {
        if (vector == null || vector.isEmpty()) return null;
        String[] parts = vector.split("/");
        for (String part : parts) {
            Double val = parseDouble(part);
            if (val != null && val >= CVSS_MIN_SCORE && val <= CVSS_MAX_SCORE) return val;
        }
        return null;
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
