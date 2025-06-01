package de.tum.cit.aet.evaluation.dto;

import java.util.List;

public record ApplicationEvaluationListDTO(List<ApplicationEvaluationOverviewDTO> applications, long totalRecords) {}
