package de.tum.cit.aet.reference.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Read model exposed to the applicant in the application creation form.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReferenceRequestDTO(
    UUID referenceRequestId,
    String title,
    String firstName,
    String lastName,
    String email,
    ReferenceRequestStatus status,
    UUID documentId
) {
    /**
     * @param entity the persisted reference request
     * @return a DTO mirroring the entity, with status downgraded to EXPIRED when the token has lapsed
     */
    public static ReferenceRequestDTO fromEntity(ReferenceRequest entity) {
        return new ReferenceRequestDTO(
            entity.getReferenceRequestId(),
            entity.getTitle(),
            entity.getFirstName(),
            entity.getLastName(),
            entity.getEmail(),
            effectiveStatus(entity),
            entity.getDocumentId()
        );
    }

    /**
     * Computes the status the client should see. The DB column is only ever {@code REQUESTED} or
     * {@code SUBMITTED}; expiry is derived from {@code tokenExpiresAt} on read so the value stays
     * accurate even when no scheduled job has run yet.
     *
     * @param entity the reference request
     * @return SUBMITTED unchanged, EXPIRED when REQUESTED + past deadline, otherwise REQUESTED
     */
    public static ReferenceRequestStatus effectiveStatus(ReferenceRequest entity) {
        ReferenceRequestStatus status = entity.getStatus();
        if (status != ReferenceRequestStatus.REQUESTED) {
            return status;
        }
        LocalDateTime expiresAt = entity.getTokenExpiresAt();
        if (expiresAt != null && expiresAt.isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            return ReferenceRequestStatus.EXPIRED;
        }
        return status;
    }
}
