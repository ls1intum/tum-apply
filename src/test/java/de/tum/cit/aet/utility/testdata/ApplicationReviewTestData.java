package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.usermanagement.domain.User;

/**
 * Test data helpers for ApplicationReview.
 */
public final class ApplicationReviewTestData {

    private ApplicationReviewTestData() {}

    /** Creates an unsaved ApplicationReview with defaults. */
    public static ApplicationReview newReview(Application application, User reviewedBy, String reason) {
        ApplicationReview r = new ApplicationReview();
        r.setApplication(application);
        r.setReviewedBy(reviewedBy);
        r.setReason(reason != null ? reason : "Review reason");
        return r;
    }

    // --- Saved variants
    // -------------------------------------------------------------------------

    public static ApplicationReview saved(ApplicationReviewRepository repo, Application application, User reviewedBy, String reason) {
        return repo.save(newReview(application, reviewedBy, reason));
    }
}
