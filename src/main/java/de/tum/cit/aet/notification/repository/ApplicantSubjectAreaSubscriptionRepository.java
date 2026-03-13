package de.tum.cit.aet.notification.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.constants.SubjectArea;
import de.tum.cit.aet.notification.domain.ApplicantSubjectAreaSubscription;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Repository for applicant subject-area subscriptions.
 */
@Repository
public interface ApplicantSubjectAreaSubscriptionRepository extends TumApplyJpaRepository<ApplicantSubjectAreaSubscription, UUID> {
    /**
     * Loads all subscriptions of one applicant in deterministic subject-area order.
     *
     * @param applicant the applicant whose subscriptions should be loaded
     * @return ordered subscriptions of the applicant
     */
    List<ApplicantSubjectAreaSubscription> findAllByApplicantOrderBySubjectAreaAsc(Applicant applicant);

    /**
     * Loads all subscriptions that match a specific subject area.
     *
     * @param subjectArea subject area to match
     * @return all subscriptions for the given subject area
     */
    List<ApplicantSubjectAreaSubscription> findAllBySubjectArea(SubjectArea subjectArea);

    /**
     * Deletes all subscriptions owned by the given applicant.
     *
     * @param applicant applicant whose subscriptions should be removed
     */
    void deleteByApplicant(Applicant applicant);
}
