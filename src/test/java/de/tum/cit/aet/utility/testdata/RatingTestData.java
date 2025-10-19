package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.evaluation.domain.Rating;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;

/**
 * Test data helpers for Rating.
 */
public final class RatingTestData {

    private RatingTestData() {}

    private static final int DEFAULT_RATING = 0;

    /** Unsaved Rating with defaults (application + professor, rating=0). */
    public static Rating newRating(Application application, User professor) {
        Rating r = new Rating();
        r.setApplication(application);
        r.setFrom(professor);
        r.setRating(DEFAULT_RATING);
        return r;
    }

    /** Unsaved Rating with override options (null = keep default). */
    public static Rating newRatingAll(Application application, User professor, Integer rating) {
        Rating r = newRating(application, professor);
        if (application != null) r.setApplication(application);
        if (professor != null) r.setFrom(professor);
        if (rating != null) r.setRating(validate(rating));
        return r;
    }

    // --- Saved variants -------------------------------------------------------------------------

    /** Saves a new Rating with given Application and Professor. */
    public static Rating saved(RatingRepository repo, Application application, User professor, Integer rating) {
        return repo.save(newRatingAll(application, professor, rating));
    }

    /** Saves a new Rating with a freshly created professor and given Application. */
    public static Rating savedWithNewProfessor(
        RatingRepository repo,
        UserRepository userRepo,
        ResearchGroup rg,
        Application application,
        Integer rating
    ) {
        User professor = UserTestData.savedProfessor(userRepo, rg);
        return saved(repo, application, professor, rating);
    }

    // --- Helper ---------------------------------------------------------------------------------

    /** Ensures rating is within -2..2 Likert scale. */
    private static int validate(int rating) {
        if (rating < -2 || rating > 2) {
            throw new IllegalArgumentException("Rating must be between -2 and 2 (Likert 5-point scale). Got: " + rating);
        }
        return rating;
    }
}
