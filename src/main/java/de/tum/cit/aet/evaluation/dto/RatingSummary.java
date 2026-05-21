package de.tum.cit.aet.evaluation.dto;

/**
 * Aggregated rating across an application's professor/employee Likert
 * ratings and the interview rating on the same Likert scale (-2 to +2).
 * Internal to the evaluation flow; never serialised to JSON.
 *
 * @param average the mean Likert value, or {@code null} if no rating of any kind exists
 * @param count   the total number of contributing ratings
 */
public record RatingSummary(Double average, int count) {
    public static RatingSummary empty() {
        return new RatingSummary(null, 0);
    }
}
