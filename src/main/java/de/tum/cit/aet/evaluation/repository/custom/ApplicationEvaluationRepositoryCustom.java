package de.tum.cit.aet.evaluation.repository.custom;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewDTO;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public interface ApplicationEvaluationRepositoryCustom {
    List<ApplicationEvaluationOverviewDTO> findApplications(
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Pageable pageable,
        Map<String, List<?>> dynamicFilters
    );

    long findIndexOfApplication(
        UUID applicationId,
        UUID researchGroupId,
        Collection<ApplicationState> states,
        Sort sort,
        Map<String, List<?>> dynamicFilters
    );

    long countApplications(UUID researchGroupId, Collection<ApplicationState> states, Map<String, List<?>> dynamicFilters);
}
