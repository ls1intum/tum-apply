package de.tum.cit.aet.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.ai.domain.ComplianceIssue;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record TranslateComplianceDTO(
    @NotBlank String text,
    @Nullable String translatedText,
    @Nullable GenderBiasAnalysisResponse originalAnalysis,
    @Nullable List<ComplianceIssue> complianceIssues
) {}
