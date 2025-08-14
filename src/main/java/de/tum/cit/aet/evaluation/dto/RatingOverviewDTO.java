package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.evaluation.domain.Rating;

import java.util.Set;
import java.util.stream.Collectors;

/**
 *
 * @param currentUserRating the rating from the current user
 * @param otherRatings ratings from other users
 */
public record RatingOverviewDTO(Integer currentUserRating, Set<RatingDTO> otherRatings) {

    /**
     * Creates a {@link RatingOverviewDTO} containing the current user's rating and
     * a collection of all ratings as {@link RatingDTO} objects.
     *
     * @param currentRating the current user's {@link Rating}, or {@code null} if the user has not rated yet
     * @param ratings       the set of all {@link Rating} entities; must not be {@code null}
     * @return a {@link RatingOverviewDTO} containing the current user's rating value and all ratings
     */
    public static RatingOverviewDTO getRatingOverviewDTO(Rating currentRating, Set<Rating> ratings) {
        Integer currentUserRating = null;

        if (currentRating != null) {
            currentUserRating = currentRating.getRating();
        }

        return new RatingOverviewDTO(currentUserRating, ratings.stream().map(RatingDTO::from).collect(Collectors.toSet()));
    }
}
