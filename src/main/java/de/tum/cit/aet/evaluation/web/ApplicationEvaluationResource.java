package de.tum.cit.aet.evaluation.web;

import de.tum.cit.aet.core.dto.OffsetPageDTO;
import de.tum.cit.aet.core.dto.SortDTO;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.evaluation.dto.*;
import de.tum.cit.aet.evaluation.service.ApplicationEvaluationService;
import de.tum.cit.aet.usermanagement.domain.User;
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
    private final CurrentUserService currentUserService;

    /**
     * Accepts an application with the given ID.
     *
     * @param applicationId the ID of the application to accept
     * @param acceptDTO     the acceptance details
     * @return HTTP 204 No Content response
     */
    @PostMapping("/applications({applicationId}/accept")
    public ResponseEntity<Void> acceptApplication(@PathVariable UUID applicationId, @RequestBody @Valid AcceptDTO acceptDTO) {
        applicationEvaluationService.acceptApplication(applicationId, acceptDTO, getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    /**
     * Rejects an application with the given ID.
     *
     * @param applicationId the ID of the application to reject
     * @param rejectDTO     the rejection details
     * @return HTTP 204 No Content response
     */
    @PostMapping("/applications({applicationId}/reject")
    public ResponseEntity<Void> rejectApplication(@PathVariable UUID applicationId, @RequestBody @Valid RejectDTO rejectDTO) {
        applicationEvaluationService.rejectApplication(applicationId, rejectDTO, getCurrentUser());
        return ResponseEntity.noContent().build();
    }

    /**
     * REST endpoint to retrieve a paginated, sorted, and filtered list of application evaluation overviews
     * for a research group.
     *
     * @param offsetPageDTO the {@link OffsetPageDTO} containing pagination (offset and limit) information
     * @param sortDto       the {@link SortDTO} specifying sorting criteria
     * @param filterDto     the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return a {@link ResponseEntity} containing the {@link ApplicationEvaluationOverviewListDTO}
     */
    @GetMapping("/applications")
    public ResponseEntity<ApplicationEvaluationOverviewListDTO> getApplicationsOverviews(
        @ParameterObject @Valid @ModelAttribute OffsetPageDTO offsetPageDTO,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute EvaluationFilterDTO filterDto
    ) {
        UUID researchGroupId = getCurrentUserResearchGroup();

        return ResponseEntity.ok(
            applicationEvaluationService.getAllApplicationsOverviews(researchGroupId, offsetPageDTO, sortDto, filterDto)
        );
    }

    /**
     * REST endpoint to retrieve a paginated, sorted, and filtered list of application evaluation details
     * for a research group.
     *
     * @param offsetPageDTO the {@link OffsetPageDTO} containing pagination (offset and limit) information
     * @param sortDto       the {@link SortDTO} specifying sorting criteria
     * @param filterDto     the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return a {@link ResponseEntity} containing the {@link ApplicationEvaluationDetailListDTO}
     */
    @GetMapping("/application-details")
    public ResponseEntity<ApplicationEvaluationDetailListDTO> getApplicationsDetails(
        @ParameterObject @Valid @ModelAttribute OffsetPageDTO offsetPageDTO,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute EvaluationFilterDTO filterDto
    ) {
        UUID researchGroupId = getCurrentUserResearchGroup();

        return ResponseEntity.ok(applicationEvaluationService.getApplicationsDetails(researchGroupId, offsetPageDTO, sortDto, filterDto));
    }

    /**
     * REST endpoint to retrieve a window of applications centered around a specific application ID.
     * Applies sorting and dynamic filtering based on request parameters.
     *
     * @param applicationId the ID of the application to center the window on
     * @param windowSize    the size of the window (must be a positive odd integer)
     * @param sortDto       the {@link SortDTO} specifying sorting criteria
     * @param filterDto     the {@link EvaluationFilterDTO} specifying dynamic filters to apply
     * @return a {@link ResponseEntity} containing the {@link ApplicationEvaluationDetailListDTO}
     */
    @GetMapping("/application-details/window")
    public ResponseEntity<ApplicationEvaluationDetailListDTO> getApplicationsDetailsWindow(
        @RequestParam UUID applicationId,
        @RequestParam int windowSize,
        @ParameterObject @ModelAttribute SortDTO sortDto,
        @ParameterObject @ModelAttribute EvaluationFilterDTO filterDto
    ) {
        UUID researchGroupId = getCurrentUserResearchGroup();

        return ResponseEntity.ok(
            applicationEvaluationService.getApplicationsDetailsWindow(applicationId, windowSize, researchGroupId, sortDto, filterDto)
        );
    }

    /**
     * Retrieves the available job filter options for the current research group.
     *
     * @return a {@link ResponseEntity} containing a set of {@link JobFilterOptionDTO}
     */
    @GetMapping("/jobs")
    public ResponseEntity<Set<JobFilterOptionDTO>> getJobFilterOptions() {
        UUID researchGroupId = getCurrentUserResearchGroup();

        return ResponseEntity.ok(applicationEvaluationService.getJobFilterOptions(researchGroupId));
    }

    @PutMapping("/applications/{applicationId}/open")
    public ResponseEntity<Void> markApplicationAsInReview(@PathVariable UUID applicationId) {
        applicationEvaluationService.markApplicationAsInReview(applicationId);
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser() {
        return currentUserService.getUser();
    }

    private UUID getCurrentUserResearchGroup() {
        return currentUserService
            .getResearchGroupIdIfProfessor()
            .orElseThrow(() -> new RuntimeException("Research group not found for current user"));
    }
}
