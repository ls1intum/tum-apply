package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import de.tum.cit.aet.reference.repository.ReferenceRequestRepository;

/**
 * Test data helpers for {@link ReferenceRequest}.
 */
public final class ReferenceRequestTestData {

    private ReferenceRequestTestData() {}

    /**
     * Creates an unsaved {@link ReferenceRequest} with sensible defaults.
     *
     * @param application the owning application
     * @param email the referee email
     * @return an unsaved entity
     */
    public static ReferenceRequest newReferenceRequest(Application application, String email) {
        return newReferenceRequest(application, "Prof. Dr.", "Ada", "Lovelace", email, ReferenceRequestStatus.REQUESTED);
    }

    /**
     * Creates an unsaved {@link ReferenceRequest} with the given fields.
     *
     * @param application the owning application
     * @param title academic title (may be {@code null})
     * @param firstName referee first name
     * @param lastName referee last name
     * @param email referee email
     * @param status lifecycle state
     * @return an unsaved entity
     */
    public static ReferenceRequest newReferenceRequest(
        Application application,
        String title,
        String firstName,
        String lastName,
        String email,
        ReferenceRequestStatus status
    ) {
        ReferenceRequest entry = new ReferenceRequest();
        entry.setApplication(application);
        entry.setTitle(title);
        entry.setFirstName(firstName);
        entry.setLastName(lastName);
        entry.setEmail(email);
        entry.setStatus(status);
        return entry;
    }

    /**
     * Persists a {@link ReferenceRequest} with sensible defaults.
     *
     * @param repo the reference request repository
     * @param application the owning application
     * @param email the referee email
     * @return the saved entity
     */
    public static ReferenceRequest saved(ReferenceRequestRepository repo, Application application, String email) {
        return repo.save(newReferenceRequest(application, email));
    }
}
