package de.tum.cit.aet.usermanagement.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.usermanagement.domain.ApplicantSubjectAreaSubscription;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
     * Deletes a specific subject area subscription for an applicant.
     * Uses @Modifying because it performs a delete operation.
     *
     * @param userId the applicant's user ID
     * @param subjectArea the subject area to unsubscribe from
     */
    @Modifying
    @Query(
        """
            DELETE FROM ApplicantSubjectAreaSubscription a
            WHERE a.applicant.userId = :userId AND a.subjectArea = :subjectArea
        """
    )
    void deleteByApplicantUserIdAndSubjectArea(@Param("userId") UUID userId, @Param("subjectArea") SubjectArea subjectArea);

    /**
     * Checks if an applicant is subscribed to a specific subject area.
     *
     * @param userId the applicant's user ID
     * @param subjectArea the subject area to check
     * @return true if subscription exists, false otherwise
     */
    boolean existsByApplicantUserIdAndSubjectArea(UUID userId, SubjectArea subjectArea);
}
