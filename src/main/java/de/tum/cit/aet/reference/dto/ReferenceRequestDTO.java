package de.tum.cit.aet.reference.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.reference.constants.AcquaintanceDepth;
import de.tum.cit.aet.reference.constants.AcquaintanceDuration;
import de.tum.cit.aet.reference.constants.OverallRecommendation;
import de.tum.cit.aet.reference.constants.PeerRating;
import de.tum.cit.aet.reference.constants.RefereeRelationship;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Read model for a reference request. Carries the referee contact details and, once the letter has
 * been submitted, the structured assessment the referee filled in on the upload page. The assessment
 * fields are null until submission. When the owning application keeps its reference letters
 * confidential, the confidential content (the uploaded letter and the structured assessment) is
 * withheld from the applicant while the referee contact details and status remain visible.
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
    RefereeRelationship relationship,
    AcquaintanceDuration acquaintanceDuration,
    AcquaintanceDepth acquaintanceDepth,
    PeerRating ratingIntellectualAbility,
    PeerRating ratingResearchPotential,
    PeerRating ratingMotivation,
    PeerRating ratingCommunication,
    PeerRating ratingLeadership,
    PeerRating ratingCollaboration,
    OverallRecommendation overallRecommendation,
    LocalDateTime deadline
) {
    /**
     * @param entity the persisted reference request
     * @return a DTO mirroring the entity, including the linked document id and the structured
     *         assessment answers when a letter was uploaded
     */
    public static ReferenceRequestDTO fromEntity(ReferenceRequest entity) {
        return fromEntity(entity, true);
    }

    /**
     * @param entity                    the persisted reference request
     * @param includeConfidentialContent whether to include the referee's confidential content, namely the
     *                                   linked uploaded letter id and the structured assessment answers
     * @return a DTO mirroring the entity; when {@code includeConfidentialContent} is {@code false} the
     *         letter id and every assessment field are left null (and thus omitted from the response),
     *         while the referee contact details and status stay visible
     */
    public static ReferenceRequestDTO fromEntity(ReferenceRequest entity, boolean includeConfidentialContent) {
        return new ReferenceRequestDTO(
            entity.getReferenceRequestId(),
            entity.getTitle(),
            entity.getFirstName(),
            entity.getLastName(),
            entity.getEmail(),
            entity.getStatus(),
            includeConfidentialContent ? entity.getDocumentId() : null,
            includeConfidentialContent ? entity.getRelationship() : null,
            includeConfidentialContent ? entity.getAcquaintanceDuration() : null,
            includeConfidentialContent ? entity.getAcquaintanceDepth() : null,
            includeConfidentialContent ? entity.getRatingIntellectualAbility() : null,
            includeConfidentialContent ? entity.getRatingResearchPotential() : null,
            includeConfidentialContent ? entity.getRatingMotivation() : null,
            includeConfidentialContent ? entity.getRatingCommunication() : null,
            includeConfidentialContent ? entity.getRatingLeadership() : null,
            includeConfidentialContent ? entity.getRatingCollaboration() : null,
            includeConfidentialContent ? entity.getOverallRecommendation() : null,
            entity.getTokenExpiresAt()
        );
    }
}
