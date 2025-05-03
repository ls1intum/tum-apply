package de.tum.cit.aet.evaluation.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewDTO;
import de.tum.cit.aet.evaluation.repository.ApplicationEvaluationRepository;
import de.tum.cit.aet.evaluation.repository.specification.ApplicationEvaluationSpecification;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class ApplicationEvaluationService {

    private static final Set<ApplicationState> VIEWABLE_STATES = Set.of(
        ApplicationState.SENT,
        ApplicationState.IN_REVIEW,
        ApplicationState.ACCEPTED,
        ApplicationState.REJECTED
    );

    private final ApplicationEvaluationRepository applicationEvaluationRepository;

    /**
     * Retrieves all viewable applications associated with the given research group.
     *
     * @param researchGroup the research group whose applications are to be retrieved
     * @return a list of {@link ApplicationEvaluationOverviewDTO} representing the viewable applications
     */
    public List<ApplicationEvaluationOverviewDTO> getAllApplications(ResearchGroup researchGroup) {
        UUID researchGroupId = researchGroup.getResearchGroupId();
        Specification<Application> spec = ApplicationEvaluationSpecification.build(researchGroupId, VIEWABLE_STATES);

        return applicationEvaluationRepository.findAll(spec).stream().map(ApplicationEvaluationOverviewDTO::fromApplication).toList();
    }
}
