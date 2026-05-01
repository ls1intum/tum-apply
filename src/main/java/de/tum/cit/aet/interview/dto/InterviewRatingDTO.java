package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.interview.domain.enumeration.AssessmentRating;

/**
 * Thin DTO carrying just the interview rating for an application.
 * The {@code rating} value is the Likert integer (-2..2) from
 * {@link AssessmentRating}, or {@code null} if no rating has been recorded yet.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record InterviewRatingDTO(Integer rating) {
    public static InterviewRatingDTO of(AssessmentRating rating) {
        return new InterviewRatingDTO(rating == null ? null : rating.getValue());
    }
}
