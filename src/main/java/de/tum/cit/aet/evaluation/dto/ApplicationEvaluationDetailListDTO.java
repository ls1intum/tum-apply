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
    /**
     * Creates an {@link ApplicationEvaluationDetailListDTO} from a collection of {@link Application} entities.
     *
     * @param applications the collection of {@link Application} entities to convert
     * @param totalRecords the total number of matching records in the dataset
     * @param currentIndex the index of the current application in the full dataset (optional, may be {@code null})
     * @param windowIndex the index of the current application within the returned window (optional, may be {@code null})
     * @return a new {@link ApplicationEvaluationDetailListDTO} containing the converted details and metadata
     */
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
