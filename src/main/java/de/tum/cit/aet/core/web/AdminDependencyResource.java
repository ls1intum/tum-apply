package de.tum.cit.aet.core.web;

import de.tum.cit.aet.core.dto.sbom.DependenciesOverviewDTO;
import de.tum.cit.aet.core.security.annotations.Admin;
import de.tum.cit.aet.core.service.DependencyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for managing Software Bill of Materials (SBOM) as admin.
 *
 * <p>Provides endpoints for retrieving the project's server-side (Java/Gradle) and
 * client-side (npm) dependencies along with their known security vulnerabilities
 * sourced from <a href="https://osv.dev">OSV.dev</a>.</p>
 */
@Slf4j
@Admin
@RestController
@RequestMapping("/api/admin/dependencies")
public class AdminDependencyResource {

    private final DependencyService dependencyService;

    /**
     * Constructs the admin dependency resource.
     *
     * @param dependencyService the service responsible for parsing dependencies and querying vulnerabilities
     */
    public AdminDependencyResource(DependencyService dependencyService) {
        this.dependencyService = dependencyService;
    }

    /**
     * Returns the dependencies overview with cached vulnerability data.
     *
     * <p>Results are served from cache if available and not expired.
     * Otherwise, a full refresh is triggered automatically.</p>
     *
     * @return {@link ResponseEntity} containing the {@link DependenciesOverviewDTO}
     */
    @GetMapping
    public ResponseEntity<DependenciesOverviewDTO> getOverview() {
        log.info("GET /api/admin/dependencies - Fetching dependencies overview");
        return ResponseEntity.ok(dependencyService.getOverview());
    }

    /**
     * Forces a fresh scan of all dependencies and re-queries OSV.dev for vulnerability data,
     * bypassing any cached results.
     *
     * @return {@link ResponseEntity} containing the refreshed {@link DependenciesOverviewDTO}
     */
    @GetMapping("/refresh")
    public ResponseEntity<DependenciesOverviewDTO> refresh() {
        log.info("GET /api/admin/dependencies/refresh - Refreshing vulnerability data");
        return ResponseEntity.ok(dependencyService.refresh());
    }
}
