package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.ApplicantSubjectAreaSubscription;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Repository for {@link ApplicantSubjectAreaSubscription}
 */
@Repository
public interface ApplicantSubjectAreaSubscriptionRepository extends TumApplyJpaRepository<ApplicantSubjectAreaSubscription, UUID> {
    /**
     * Finds all subject area subscriptions for a given applicant user ID.
     *
     * @param userId the applicant's user ID
     * @return list of subscriptions for the user, empty list if none exist
     */
    List<ApplicantSubjectAreaSubscription> findByApplicantUserId(UUID userId);

    /**
     * Finds a subject area subscription for a given applicant user ID and subject area.
     *
     * @param userId the applicant's user ID
     * @param subjectArea the subject area to look up
     * @return the matching subscription, or empty if none exists
     */
    Optional<ApplicantSubjectAreaSubscription> findByApplicantUserIdAndSubjectArea(UUID userId, SubjectArea subjectArea);

    /**
     * Deletes a specific subject area subscription for an applicant.
     *
     * @param userId the applicant's user ID
     * @param subjectArea the subject area to unsubscribe from
     */
    void deleteByApplicantUserIdAndSubjectArea(UUID userId, SubjectArea subjectArea);
}
