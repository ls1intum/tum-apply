package de.tum.cit.aet.reference.web;

import de.tum.cit.aet.core.security.annotations.ApplicantOrAdmin;
import de.tum.cit.aet.reference.dto.CreateReferenceRequestDTO;
import de.tum.cit.aet.reference.dto.ReferenceRequestDTO;
import de.tum.cit.aet.reference.service.ReferenceRequestService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints for managing the referee contacts attached to an application.
 * All endpoints require the caller to own the underlying application.
 */
@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/applications/{applicationId}/references")
public class ReferenceRequestResource {

    private final ReferenceRequestService referenceRequestService;

    /**
     * Lists all referee contacts attached to the given application.
     *
     * @param applicationId the application owning the references
     * @return ordered list of reference DTOs
     */
    @ApplicantOrAdmin
    @GetMapping
    public ResponseEntity<List<ReferenceRequestDTO>> getReferences(@PathVariable UUID applicationId) {
        log.info("GET /api/applications/{}/references - Fetching references", applicationId);
        return ResponseEntity.ok(referenceRequestService.listForApplication(applicationId));
    }

    /**
     * Adds a new referee contact to the application.
     *
     * @param applicationId the application to attach the contact to
     * @param payload       title, name and email of the referee
     * @return the persisted reference DTO
     */
    @ApplicantOrAdmin
    @PostMapping
    public ResponseEntity<ReferenceRequestDTO> add(
        @PathVariable UUID applicationId,
        @Valid @RequestBody CreateReferenceRequestDTO payload
    ) {
        log.info("POST /api/applications/{}/references - Adding reference {}", applicationId, payload.toString());
        return ResponseEntity.status(HttpStatus.CREATED).body(referenceRequestService.addToApplication(applicationId, payload));
    }

    /**
     * Removes a referee contact from the application.
     *
     * @param applicationId the application owning the reference
     * @param referenceId   the reference to remove
     * @return 204 No Content on success
     */
    @ApplicantOrAdmin
    @DeleteMapping("/{referenceId}")
    public ResponseEntity<Void> remove(@PathVariable UUID applicationId, @PathVariable UUID referenceId) {
        log.info("DELETE /api/applications/{}/references/{} - Deleting reference", applicationId, referenceId);
        referenceRequestService.removeFromApplication(applicationId, referenceId);
        return ResponseEntity.noContent().build();
    }
}
