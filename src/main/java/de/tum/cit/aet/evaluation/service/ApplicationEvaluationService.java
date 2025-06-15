package de.tum.cit.aet.evaluation.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.dto.OffsetPageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.util.OffsetPageRequest;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationDetailListDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewListDTO;
import de.tum.cit.aet.evaluation.repository.ApplicationEvaluationRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
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
     * @param offsetPageDTO containing the offset and limit for pagination
     * @param sortDTO       containing the optional field and direction used for sorting the results
     * @return an {@link ApplicationEvaluationOverviewListDTO} containing application overviews
     * and the total number of matching records
     */
    public ApplicationEvaluationOverviewListDTO getAllApplications(
        ResearchGroup researchGroup,
        OffsetPageDTO offsetPageDTO,
        SortDTO sortDTO
    ) {
        UUID researchGroupId = researchGroup.getResearchGroupId();

        Pageable pageable = new OffsetPageRequest(offsetPageDTO.offset(), offsetPageDTO.limit(), sortDTO.toSpringSort(SORTABLE_FIELDS));
        List<Application> applicationsPage = getApplications(researchGroupId, pageable, null);
        long totalRecords = applicationEvaluationRepository.countApplications(researchGroupId, VIEWABLE_STATES, null);

        return ApplicationEvaluationOverviewListDTO.fromApplications(applicationsPage, totalRecords);
    }

    public ApplicationEvaluationDetailListDTO getApplicationDetailsWindow(
        UUID applicationId,
        Integer windowSize,
        ResearchGroup researchGroup,
        SortDTO sortDTO
    ) {
        UUID researchGroupId = researchGroup.getResearchGroupId();
        long totalRecords = applicationEvaluationRepository.countApplications(researchGroupId, VIEWABLE_STATES, null);

        if (windowSize == null || windowSize <= 0 || (windowSize % 2) != 1) {
            throw new IllegalArgumentException("Window size must be a positive and odd integer");
        }
        long idx = applicationEvaluationRepository.findIndexOfApplication(
            applicationId,
            researchGroupId,
            VIEWABLE_STATES,
            sortDTO.toSpringSort(SORTABLE_FIELDS),
            null
        );

        int half = (int) Math.floor((double) windowSize / 2);
        int start = Math.max((int) idx - half, 0);
        int end = Math.min((int) idx + half + 1, (int) totalRecords);
        int windowIndex = (int) idx - start;

        Pageable pageable = new OffsetPageRequest(start, end - start, sortDTO.toSpringSort(SORTABLE_FIELDS));
        List<Application> applicationsPage = getApplications(researchGroupId, pageable, null);
        return ApplicationEvaluationDetailListDTO.fromApplications(applicationsPage, totalRecords, (int) idx, windowIndex);
    }

    public ApplicationEvaluationDetailListDTO getApplications(ResearchGroup researchGroup, OffsetPageDTO offsetPageDTO, SortDTO sortDTO) {
        UUID researchGroupId = researchGroup.getResearchGroupId();

        Pageable pageable = new OffsetPageRequest(offsetPageDTO.offset(), offsetPageDTO.limit(), sortDTO.toSpringSort(SORTABLE_FIELDS));

        List<Application> applicationsPage = getApplications(researchGroupId, pageable, null);
        long totalRecords = applicationEvaluationRepository.countApplications(researchGroupId, VIEWABLE_STATES, null);
        return ApplicationEvaluationDetailListDTO.fromApplications(applicationsPage, totalRecords, null, null);
    }

    private List<Application> getApplications(UUID researchGroupId, Pageable pageable, Map<String, List<?>> dynamicFilters) {
        return applicationEvaluationRepository.findApplications(researchGroupId, VIEWABLE_STATES, pageable, dynamicFilters);
    }
}
