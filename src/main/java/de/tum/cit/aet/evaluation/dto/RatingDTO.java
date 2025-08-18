package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.evaluation.domain.Rating;

public record RatingDTO(String from, int rating) {
    /**
     * Creates a {@link RatingDTO} from a given {@link Rating} entity.
     *
     * @param rating the {@link Rating} entity to convert; must not be {@code null}
     * @return a {@link RatingDTO} containing the rater's full name and rating value
     */
    public static RatingDTO from(Rating rating) {
        return new RatingDTO(rating.getFrom().getFirstName() + " " + rating.getFrom().getLastName(), rating.getRating());
    }
}
