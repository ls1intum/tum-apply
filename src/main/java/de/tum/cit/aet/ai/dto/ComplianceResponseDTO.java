package de.tum.cit.aet.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ComplianceResponseDTO(
        List<ComplianceIssueDTO> issues
    ){}

