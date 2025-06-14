package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import java.util.List;

public record ApplicationEvaluationDetailListDTO(
    //TODO change DTO
    List<ApplicationForApplicantDTO> applications,
    long totalRecords,
    Integer currentIndex,
    Integer windowIndex
) {}
