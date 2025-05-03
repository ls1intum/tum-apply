package de.tum.cit.aet.evaluation.web;

import de.tum.cit.aet.evaluation.dto.ApplicationEvaluationOverviewDTO;
import de.tum.cit.aet.evaluation.service.ApplicationEvaluationService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/evaluation")
@AllArgsConstructor
public class ApplicationEvaluationResource {

    private final ApplicationEvaluationService applicationEvaluationService;

    /**
     * {@code GET /applications} : Retrieve all applications for a research group.
     *
     * <p><b>Note:</b> This method currently uses a hardcoded research group ID as a placeholder.
     * This will be replaced when authenticated user context is integrated to retrieve the associated research group dynamically.</p>
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of application evaluation overviews.
     */
    @GetMapping("/applications")
    public ResponseEntity<List<ApplicationEvaluationOverviewDTO>> getApplications() {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));

        return ResponseEntity.ok(applicationEvaluationService.getAllApplications(researchGroup));
    }
}
