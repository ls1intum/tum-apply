package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.ApplicantSubjectAreaSubscription;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for {@link ApplicantSubjectAreaSubscription}
 */
public record ApplicantSubjectAreaSubscriptionDTO(@NotNull SubjectArea subjectArea) {
    /**
     * Converts an ApplicantSubjectAreaSubscription entity to its DTO representation.
     *
     * @param subscription the subscription entity
     * @return the corresponding DTO, or null if subscription is null
     */
    public static ApplicantSubjectAreaSubscriptionDTO getFromEntity(ApplicantSubjectAreaSubscription subscription) {
        if (subscription == null) {
            return null;
        }
        return new ApplicantSubjectAreaSubscriptionDTO(subscription.getSubjectArea());
    }
}
