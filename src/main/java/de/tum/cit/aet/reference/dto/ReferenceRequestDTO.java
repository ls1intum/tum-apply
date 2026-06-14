package de.tum.cit.aet.reference.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.reference.constants.AcquaintanceDepth;
import de.tum.cit.aet.reference.constants.AcquaintanceDuration;
import de.tum.cit.aet.reference.constants.OverallRecommendation;
import de.tum.cit.aet.reference.constants.PeerRating;
import de.tum.cit.aet.reference.constants.RefereeRelationship;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import java.util.UUID;

/**
 * Read model for a reference request. Carries the referee contact details and, once the letter has
 * been submitted, the structured assessment the referee filled in on the upload page. The assessment
 * fields are null until submission.
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
    OverallRecommendation overallRecommendation
) {
    /**
     * @param entity the persisted reference request
     * @return a DTO mirroring the entity, including the linked document id and the structured
     *         assessment answers when a letter was uploaded
     */
    public static ReferenceRequestDTO fromEntity(ReferenceRequest entity) {
        return new ReferenceRequestDTO(
            entity.getReferenceRequestId(),
            entity.getTitle(),
            entity.getFirstName(),
            entity.getLastName(),
            entity.getEmail(),
            entity.getStatus(),
            entity.getDocumentId(),
            entity.getRelationship(),
            entity.getAcquaintanceDuration(),
            entity.getAcquaintanceDepth(),
            entity.getRatingIntellectualAbility(),
            entity.getRatingResearchPotential(),
            entity.getRatingMotivation(),
            entity.getRatingCommunication(),
            entity.getRatingLeadership(),
            entity.getRatingCollaboration(),
            entity.getOverallRecommendation()
        );
    }
}
