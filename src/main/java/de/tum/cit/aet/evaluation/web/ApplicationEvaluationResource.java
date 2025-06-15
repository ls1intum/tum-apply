package de.tum.cit.aet.evaluation.web;

import de.tum.cit.aet.core.dto.OffsetPageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationDetailListDTO;
import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewListDTO;
import de.tum.cit.aet.evaluation.service.ApplicationEvaluationService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.validation.Valid;
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
     * {@code GET /applications} : Retrieve a paginated and optionally sorted list of applications for a research group.
     *
     * @param offsetPageDTO containing the offset and limit of applications
     * @param sortDto containing the optional field and direction used for sorting the results
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} containing an
     * {@link ApplicationEvaluationOverviewListDTO} with application overviews and total count
     */
    @GetMapping("/applications")
    public ResponseEntity<ApplicationEvaluationOverviewListDTO> getApplications(
        @ParameterObject @Valid @ModelAttribute OffsetPageDTO offsetPageDTO,
        @ParameterObject @ModelAttribute SortDTO sortDto
    ) {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));

        return ResponseEntity.ok(applicationEvaluationService.getAllApplications(researchGroup, offsetPageDTO, sortDto));
    }

    @GetMapping("/application-details")
    public ResponseEntity<ApplicationEvaluationDetailListDTO> getApplicationDetails(
        @ParameterObject @Valid @ModelAttribute OffsetPageDTO offsetPageDTO,
        @ParameterObject @ModelAttribute SortDTO sortDto
    ) {
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        return ResponseEntity.ok(null);
    }

    @GetMapping("/application-details/window")
    public ResponseEntity<ApplicationEvaluationDetailListDTO> getApplicationDetailsWindow(
        @RequestParam UUID applicationId,
        @RequestParam int windowSize,
        @ParameterObject @ModelAttribute SortDTO sortDto
    ) {
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        return ResponseEntity.ok(
            applicationEvaluationService.getApplicationDetailsWindow(applicationId, windowSize, researchGroup, sortDto)
        );
    }
}
