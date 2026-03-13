package de.tum.cit.aet.notification.web;

import de.tum.cit.aet.core.security.annotations.Applicant;
import de.tum.cit.aet.notification.dto.ApplicantSubjectAreaSubscriptionDTO;
import de.tum.cit.aet.notification.service.ApplicantSubjectAreaSubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST endpoints for managing the authenticated applicant's subject-area subscriptions.
 */
@RestController
@RequestMapping("/api/settings/subject-area-subscriptions")
@RequiredArgsConstructor
public class ApplicantSubjectAreaSubscriptionResource {

    private final ApplicantSubjectAreaSubscriptionService applicantSubjectAreaSubscriptionService;

    /**
     * Returns the saved subject-area subscriptions of the authenticated applicant.
     *
     * @return current subscription preferences of the applicant
     */
    @Applicant
    @GetMapping
    public ResponseEntity<ApplicantSubjectAreaSubscriptionDTO> getCurrentApplicantSubscriptions() {
        return ResponseEntity.ok(applicantSubjectAreaSubscriptionService.getCurrentApplicantSubscriptions());
    }

    /**
     * Replaces the authenticated applicant's subject-area subscriptions.
     *
     * @param dto new complete subscription state
     * @return normalized persisted subscription preferences
     */
    @Applicant
    @PutMapping
    public ResponseEntity<ApplicantSubjectAreaSubscriptionDTO> updateCurrentApplicantSubscriptions(
        @Valid @RequestBody ApplicantSubjectAreaSubscriptionDTO dto
    ) {
        return ResponseEntity.ok(applicantSubjectAreaSubscriptionService.updateCurrentApplicantSubscriptions(dto));
    }
}
