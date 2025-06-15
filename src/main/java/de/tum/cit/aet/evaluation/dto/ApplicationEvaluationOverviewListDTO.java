package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.domain.Application;
import java.util.Collection;
import java.util.List;

public record ApplicationEvaluationOverviewListDTO(List<ApplicationEvaluationOverviewDTO> applications, long totalRecords) {
    public static ApplicationEvaluationOverviewListDTO fromApplications(Collection<Application> applications, long totalRecords) {
        return new ApplicationEvaluationOverviewListDTO(
            applications.stream().map(ApplicationEvaluationOverviewDTO::fromApplication).toList(),
            totalRecords
        );
    }
}
