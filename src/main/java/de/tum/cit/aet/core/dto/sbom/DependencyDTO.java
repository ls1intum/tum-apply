package de.tum.cit.aet.core.dto.sbom;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DependencyDTO(
    String name,
    String group,
    String version,
    String source,
    String purl,
    List<VulnerabilityDTO> vulnerabilities
) {}
