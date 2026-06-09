package de.tum.cit.aet.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.ai.domain.BiasedIssue;
import jakarta.annotation.Nullable;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record TranslateComplianceDTO(@NotBlank String text, @Nullable List<BiasedIssue> originalAnalysis) {}
