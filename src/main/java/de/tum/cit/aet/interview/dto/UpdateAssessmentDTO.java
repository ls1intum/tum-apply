package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * DTO for updating interviewee assessment (rating and notes).
 * At least one field must be provided.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record UpdateAssessmentDTO(
    @Min(value = -2, message = "Rating must be between -2 and 2")
    @Max(value = 2, message = "Rating must be between -2 and 2")
    Integer rating,

    Boolean clearRating,

    String notes
) {
    /**
     * Checks if the DTO has at least one field set.
     *
     * @return true if either rating, clearRating, or notes is provided
     */
    public boolean hasContent() {
        return rating != null || Boolean.TRUE.equals(clearRating) || notes != null;
    }
}
