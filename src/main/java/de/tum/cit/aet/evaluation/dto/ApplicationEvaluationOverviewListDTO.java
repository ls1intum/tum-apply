package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.domain.Application;
import java.util.Collection;
import java.util.List;

public record ApplicationEvaluationOverviewListDTO(List<ApplicationEvaluationOverviewDTO> applications, long totalRecords) {
    /**
     * Creates an {@link ApplicationEvaluationOverviewListDTO} from a collection of {@link Application} entities.
     * Converts each application into an overview DTO and attaches the total record count.
     *
     * @param applications the collection of {@link Application} entities to convert
     * @param totalRecords the total number of matching records in the dataset
     * @return a new {@link ApplicationEvaluationOverviewListDTO} containing the converted overviews and metadata
     */
    public static ApplicationEvaluationOverviewListDTO fromApplications(Collection<Application> applications, long totalRecords) {
        return new ApplicationEvaluationOverviewListDTO(
            applications.stream().map(ApplicationEvaluationOverviewDTO::fromApplication).toList(),
            totalRecords
        );
    }
}
