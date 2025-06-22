package de.tum.cit.aet.evaluation.web;

import de.tum.cit.aet.core.dto.OffsetPageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationDetailListDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewListDTO;
import de.tum.cit.aet.evaluation.dto.EvaluationFilterDTO;
import de.tum.cit.aet.evaluation.dto.JobFilterOptionDTO;
import de.tum.cit.aet.evaluation.service.ApplicationEvaluationService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.validation.Valid;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/evaluation")
@AllArgsConstructor
public class ApplicationEvaluationResource {

    private final ApplicationEvaluationService applicationEvaluationService;

    /**
     * REST endpoint to retrieve a paginated, sorted, and filtered list of application evaluation overviews
     * for a research group.
     *
     * @param offsetPageDTO the {@link OffsetPageDTO} containing pagination (offset and limit) information
     * @param sortDto the {@link SortDTO} specifying sorting criteria
     * @param filterDto the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return a {@link ResponseEntity} containing the {@link ApplicationEvaluationOverviewListDTO}
     */
    @GetMapping("/applications")
    public ResponseEntity<ApplicationEvaluationOverviewListDTO> getApplicationsOverviews(
        @ParameterObject @Valid @ModelAttribute OffsetPageDTO offsetPageDTO,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute EvaluationFilterDTO filterDto
    ) {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));

        return ResponseEntity.ok(
            applicationEvaluationService.getAllApplicationsOverviews(researchGroup, offsetPageDTO, sortDto, filterDto)
        );
    }

    /**
     * REST endpoint to retrieve a paginated, sorted, and filtered list of application evaluation details
     * for a research group.
     *
     * @param offsetPageDTO the {@link OffsetPageDTO} containing pagination (offset and limit) information
     * @param sortDto the {@link SortDTO} specifying sorting criteria
     * @param filterDto the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return a {@link ResponseEntity} containing the {@link ApplicationEvaluationDetailListDTO}
     */
    @GetMapping("/application-details")
    public ResponseEntity<ApplicationEvaluationDetailListDTO> getApplicationsDetails(
        @ParameterObject @Valid @ModelAttribute OffsetPageDTO offsetPageDTO,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute EvaluationFilterDTO filterDto
    ) {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        return ResponseEntity.ok(applicationEvaluationService.getApplicationsDetails(researchGroup, offsetPageDTO, sortDto, filterDto));
    }

    /**
     * REST endpoint to retrieve a window of applications centered around a specific application ID.
     * Applies sorting and dynamic filtering based on request parameters.
     *
     * @param applicationId the ID of the application to center the window on
     * @param windowSize the size of the window (must be a positive odd integer)
     * @param sortDto the {@link SortDTO} specifying sorting criteria
     * @param filterDto the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return a {@link ResponseEntity} containing the {@link ApplicationEvaluationDetailListDTO}
     */
    @GetMapping("/application-details/window")
    public ResponseEntity<ApplicationEvaluationDetailListDTO> getApplicationsDetailsWindow(
        @RequestParam UUID applicationId,
        @RequestParam int windowSize,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute EvaluationFilterDTO filterDto
    ) {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        return ResponseEntity.ok(
            applicationEvaluationService.getApplicationsDetailsWindow(applicationId, windowSize, researchGroup, sortDto, filterDto)
        );
    }

    @GetMapping("/jobs")
    public ResponseEntity<Set<JobFilterOptionDTO>> getJobFilterOptions() {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        return ResponseEntity.ok(applicationEvaluationService.getJobFilterOptions(researchGroup));
    }
}
