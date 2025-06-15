package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.domain.Application;
import java.util.Collection;
import java.util.List;

public record ApplicationEvaluationDetailListDTO(
    List<ApplicationEvaluationDetailDTO> applications,
    long totalRecords,
    Integer currentIndex,
    Integer windowIndex
) {
    public static ApplicationEvaluationDetailListDTO fromApplications(
        Collection<Application> applications,
        long totalRecords,
        Integer currentIndex,
        Integer windowIndex
    ) {
        return new ApplicationEvaluationDetailListDTO(
            applications.stream().map(ApplicationEvaluationDetailDTO::fromApplication).toList(),
            totalRecords,
            currentIndex,
            windowIndex
        );
    }
}
