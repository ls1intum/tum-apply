package de.tum.cit.aet.evaluation.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
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

    private static final Set<String> SORTABLE_FIELDS = Set.of("rating", "createdAt", "applicant.lastName", "state");

    private final ApplicationEvaluationRepository applicationEvaluationRepository;

    /**
     * Retrieves a paginated and optionally sorted list of applications for a given research group.
     *
     * @param researchGroup the research group whose applications are to be retrieved
     * @param pageDTO       containing the page number and page size for pagination
     * @param sortDTO       containing the optional field and direction used for sorting the results
     * @return an {@link ApplicationEvaluationListDTO} containing application overviews
     *         and the total number of matching records
     */
    public ApplicationEvaluationListDTO getAllApplications(ResearchGroup researchGroup, PageDTO pageDTO, SortDTO sortDTO) {
        UUID researchGroupId = researchGroup.getResearchGroupId();

        Specification<Application> specification = ApplicationEvaluationSpecification.build(researchGroupId, VIEWABLE_STATES);
        Pageable pageable = PageRequest.of(pageDTO.pageNumber(), pageDTO.pageSize(), sortDTO.toSpringSort(SORTABLE_FIELDS));
        Page<Application> applicationsPage = applicationEvaluationRepository.findAll(specification, pageable);

        return ApplicationEvaluationListDTO.fromPage(applicationsPage);
    }
}
