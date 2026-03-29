package de.tum.cit.aet.core.dto.sbom;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DependenciesOverviewDTO(
    List<DependencyDTO> dependencies,
    int serverCount,
    int clientCount,
    int totalVulnerabilities,
    int criticalCount,
    int highCount,
    int mediumCount,
    int lowCount
) {}
