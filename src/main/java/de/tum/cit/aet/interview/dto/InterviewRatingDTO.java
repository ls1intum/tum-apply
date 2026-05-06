package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.interview.domain.enumeration.AssessmentRating;

/**
 * Thin DTO carrying the interview rating and the professor's assessment notes
 * for an application. The {@code rating} value is the Likert integer (-2..2)
 * from {@link AssessmentRating}, or {@code null} if no rating has been
 * recorded yet. The {@code assessmentNotes} is the free-text notes the
 * professor recorded during the interview, or {@code null} if none.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record InterviewRatingDTO(Integer rating, String assessmentNotes) {
    public static InterviewRatingDTO of(AssessmentRating rating, String assessmentNotes) {
        return new InterviewRatingDTO(rating == null ? null : rating.getValue(), assessmentNotes);
    }
}
