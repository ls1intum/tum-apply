package de.tum.cit.aet.evaluation.web;

import de.tum.cit.aet.evaluation.dto.RatingOverviewDTO;
import de.tum.cit.aet.evaluation.service.RatingService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/applications/{applicationId}/ratings")
@AllArgsConstructor
public class RatingResource {

    private final RatingService ratingService;

    /**
     * Retrieves the ratings for the specified application.
     *
     * @param applicationId the unique ID of the application; must not be {@code null}
     * @return a {@link ResponseEntity} containing the {@link RatingOverviewDTO} for the specified application
     */
    @GetMapping
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<RatingOverviewDTO> getRatings(@PathVariable("applicationId") UUID applicationId) {
        return ResponseEntity.ok(ratingService.getRatingOverview(applicationId));
    }

    /**
     * Creates, updates, or deletes the current user's rating for the specified application.
     *
     * @param applicationId the unique ID of the application to rate; must not be {@code null}
     * @param rating        the rating value to set (from -2 to 2), or {@code null} to remove the current rating
     * @return a {@link ResponseEntity} containing the updated {@link RatingOverviewDTO} for the specified application
     */
    @PutMapping
    @PreAuthorize("hasRole('PROFESSOR')")
    public ResponseEntity<RatingOverviewDTO> updateRating(
        @PathVariable("applicationId") UUID applicationId,
        @RequestParam(required = false) @Min(-2) @Max(2) Integer rating
    ) {
        return ResponseEntity.ok(ratingService.updateRating(applicationId, rating));
    }
}
