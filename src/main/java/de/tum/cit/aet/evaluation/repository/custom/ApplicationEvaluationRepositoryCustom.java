package de.tum.cit.aet.evaluation.repository.custom;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewDTO;
import java.util.Collection;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ApplicationEvaluationRepositoryCustom {
    Page<ApplicationEvaluationOverviewDTO> findApplications(UUID researchGroupId, Collection<ApplicationState> states, Pageable pageable);
}
