package de.tum.cit.aet.ai.dto;

import de.tum.cit.aet.ai.domain.ComplianceIssue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record MapComplianceIssuesRequestDTO(
    @NotBlank String text,
    @NotBlank String translatedText,
    @NotNull List<ComplianceIssue> complianceIssues
) {}
