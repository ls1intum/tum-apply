package de.tum.cit.aet.reference.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read model exposed to the applicant in the application creation form and to professors on the
 * evaluation page. Includes the confidentiality decision and the referee's submission deadline.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReferenceRequestDTO(
    UUID referenceRequestId,
    String title,
    String firstName,
    String lastName,
    String email,
    ReferenceRequestStatus status,
    UUID documentId,
    boolean confidential,
    LocalDateTime deadline
) {
    /**
     * @param entity       the persisted reference request
     * @param confidential the owning application's confidentiality waiver, applied to all its reference letters
     * @return a DTO mirroring the entity, including the linked document id when a letter was uploaded
     */
    public static ReferenceRequestDTO fromEntity(ReferenceRequest entity, boolean confidential) {
        return new ReferenceRequestDTO(
            entity.getReferenceRequestId(),
            entity.getTitle(),
            entity.getFirstName(),
            entity.getLastName(),
            entity.getEmail(),
            entity.getStatus(),
            entity.getDocumentId(),
            confidential,
            entity.getTokenExpiresAt()
        );
    }
}
