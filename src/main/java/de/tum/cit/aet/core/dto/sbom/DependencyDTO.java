package de.tum.cit.aet.core.dto.sbom;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DependencyDTO(
    String name,
    String group,
    String version,
    String source,
    String purl,
    List<VulnerabilityDTO> vulnerabilities
) {}
