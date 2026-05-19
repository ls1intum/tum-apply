package de.tum.cit.aet.evaluation.dto;

/**
 * Aggregated rating information for an application.
 *
 * @param average the average rating on the Likert scale (-2 to +2), or {@code null} if no ratings exist
 * @param count   the total number of contributing ratings (professor ratings + interview rating)
 */
public record RatingSummary(Double average, int count) {
    public static RatingSummary empty() {
        return new RatingSummary(null, 0);
    }
}
