package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.domain.Application;
import java.util.List;
import org.springframework.data.domain.Page;

public record ApplicationEvaluationListDTO(List<ApplicationEvaluationOverviewDTO> applications, long totalRecords) {
    /**
     * Converts a {@link Page} of {@link Application} entities into an {@link ApplicationEvaluationListDTO}.
     *
     * @param applicationsPage the page of {@link Application} entities to convert; may be {@code null}
     * @return a new {@link ApplicationEvaluationListDTO} containing the mapped DTOs and total element count,
     * or {@code null} if the input page is {@code null}
     */
    public static ApplicationEvaluationListDTO fromPage(Page<Application> applicationsPage) {
        if (applicationsPage == null) {
            return new ApplicationEvaluationListDTO(null, 0);
        }

        List<ApplicationEvaluationOverviewDTO> overviewDTOs = applicationsPage
            .getContent()
            .stream()
            .map(ApplicationEvaluationOverviewDTO::fromApplication)
            .toList();

        return new ApplicationEvaluationListDTO(overviewDTOs, applicationsPage.getTotalElements());
    }
}
