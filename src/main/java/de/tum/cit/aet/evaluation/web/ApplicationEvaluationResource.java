package de.tum.cit.aet.evaluation.web;

import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationListDTO;
import de.tum.cit.aet.evaluation.service.ApplicationEvaluationService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/evaluation")
@AllArgsConstructor
@Validated
public class ApplicationEvaluationResource {

    private final ApplicationEvaluationService applicationEvaluationService;

    /**
     * {@code GET /applications} : Retrieve a paginated list of applications for a research group.
     *
     * @param pageSize   the number of applications per page (default is 25)
     * @param pageNumber the page index to retrieve, starting from 0 (default is 0)
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} containing an
     * {@link ApplicationEvaluationListDTO} with application overviews and total count
     */
    @GetMapping("/applications")
    public ResponseEntity<ApplicationEvaluationListDTO> getApplications(
        @RequestParam(required = false, defaultValue = "25") @Min(1) int pageSize,
        @RequestParam(required = false, defaultValue = "0") @Min(0) int pageNumber
    ) {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));

        return ResponseEntity.ok(applicationEvaluationService.getAllApplications(researchGroup, pageSize, pageNumber));
    }
}
