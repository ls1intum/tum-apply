package de.tum.cit.aet.ai.dto;

import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import de.tum.cit.aet.job.dto.JobFormDTO;
import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public record TranslateComplianceDTO(
    @NotBlank String text,
    @Nullable GenderBiasAnalysisResponse originalAnalysis,
    JobFormDTO jobForm
) {}

