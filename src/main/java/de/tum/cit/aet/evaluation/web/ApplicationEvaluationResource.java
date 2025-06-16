package de.tum.cit.aet.evaluation.web;

import de.tum.cit.aet.core.dto.FilterDTO;
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

    @GetMapping("/applications")
    public ResponseEntity<ApplicationEvaluationOverviewListDTO> getApplicationsOverviews(
        @ParameterObject @Valid @ModelAttribute OffsetPageDTO offsetPageDTO,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute FilterDTO filterDto
    ) {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));

        return ResponseEntity.ok(
            applicationEvaluationService.getAllApplicationsOverviews(researchGroup, offsetPageDTO, sortDto, filterDto)
        );
    }

    @GetMapping("/application-details")
    public ResponseEntity<ApplicationEvaluationDetailListDTO> getApplicationsDetails(
        @ParameterObject @Valid @ModelAttribute OffsetPageDTO offsetPageDTO,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute FilterDTO filterDto
    ) {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        return ResponseEntity.ok(applicationEvaluationService.getApplicationsDetails(researchGroup, offsetPageDTO, sortDto, filterDto));
    }

    @GetMapping("/application-details/window")
    public ResponseEntity<ApplicationEvaluationDetailListDTO> getApplicationsDetailsWindow(
        @RequestParam UUID applicationId,
        @RequestParam int windowSize,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute FilterDTO filterDto
    ) {
        //TODO this will be removed when the ResearchGroup can be accessed through the authenticated user
        ResearchGroup researchGroup = new ResearchGroup();
        researchGroup.setResearchGroupId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        return ResponseEntity.ok(
            applicationEvaluationService.getApplicationsDetailsWindow(applicationId, windowSize, researchGroup, sortDto, filterDto)
        );
    }
}
