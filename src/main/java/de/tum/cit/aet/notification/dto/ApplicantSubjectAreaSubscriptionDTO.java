package de.tum.cit.aet.notification.dto;

import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.notification.domain.ApplicantSubjectAreaSubscription;
import jakarta.validation.constraints.NotNull;
import java.util.Comparator;
import java.util.List;

/**
 * API payload for an applicant's selected subject areas.
 *
 * @param subjectAreas the subscribed subject areas represented as canonical enum values
 */
public record ApplicantSubjectAreaSubscriptionDTO(@NotNull List<@NotNull SubjectArea> subjectAreas) {
    /**
     * Creates a normalized DTO from persisted subscription entities.
     * The subject areas are returned in stable enum-name order.
     *
     * @param subscriptions persisted subscriptions of one applicant
     * @return DTO containing the normalized subject-area list
     */
    public static ApplicantSubjectAreaSubscriptionDTO fromEntities(List<ApplicantSubjectAreaSubscription> subscriptions) {
        List<SubjectArea> subjectAreas = subscriptions
            .stream()
            .map(ApplicantSubjectAreaSubscription::getSubjectArea)
            .sorted(Comparator.comparing(Enum::name))
            .toList();

        return new ApplicantSubjectAreaSubscriptionDTO(subjectAreas);
    }
}
