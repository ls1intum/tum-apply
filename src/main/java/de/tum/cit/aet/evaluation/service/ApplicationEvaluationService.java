package de.tum.cit.aet.evaluation.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationListDTO;
import de.tum.cit.aet.evaluation.repository.ApplicationEvaluationRepository;
import de.tum.cit.aet.evaluation.repository.specification.ApplicationEvaluationSpecification;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
     * @param researchGroup the research group whose applications are to be retrieved
     * @param pageSize      the number of applications per page (must be ≥ 1)
     * @param pageNumber    the page index to retrieve (0-based)
     * @return an {@link ApplicationEvaluationListDTO} containing application overviews
     * and the total number of matching records
     */
    public ApplicationEvaluationListDTO getAllApplications(ResearchGroup researchGroup, int pageSize, int pageNumber) {
        UUID researchGroupId = researchGroup.getResearchGroupId();

        Specification<Application> specification = ApplicationEvaluationSpecification.build(researchGroupId, VIEWABLE_STATES);
        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<Application> applicationsPage = applicationEvaluationRepository.findAll(specification, pageable);
        return ApplicationEvaluationListDTO.fromPage(applicationsPage);
    }
}
