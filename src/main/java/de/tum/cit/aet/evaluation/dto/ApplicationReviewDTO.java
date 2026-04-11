package de.tum.cit.aet.evaluation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Flat representation of an {@link ApplicationReview} that keeps the entity id
 * and the reviewer's user id (rather than a denormalized name string), making
 * it suitable for re-importable JSON dumps.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApplicationReviewDTO(UUID applicationReviewId, UUID reviewedByUserId, String reason, LocalDateTime reviewedAt) {
    /**
     * @param review the entity to convert; may be {@code null}
     * @return a flat DTO, or {@code null} if {@code review} is {@code null}
     */
    public static ApplicationReviewDTO getFromEntity(ApplicationReview review) {
        if (review == null) {
            return null;
        }
        return new ApplicationReviewDTO(
            review.getApplicationReviewId(),
            review.getReviewedBy() == null ? null : review.getReviewedBy().getUserId(),
            review.getReason(),
            review.getReviewedAt()
        );
    }
}
