package de.tum.cit.aet.reference.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
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
     * @return a DTO mirroring the entity, including the linked document id when a letter was uploaded
     */
    public static ReferenceRequestDTO fromEntity(ReferenceRequest entity) {
        return new ReferenceRequestDTO(
            entity.getReferenceRequestId(),
            entity.getTitle(),
            entity.getFirstName(),
            entity.getLastName(),
            entity.getEmail(),
            entity.getStatus(),
            entity.getDocumentId()
        );
    }
}
