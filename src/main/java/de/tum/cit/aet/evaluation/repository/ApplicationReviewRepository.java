package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link ApplicationReview} entity.
 */
@Repository
public interface ApplicationReviewRepository extends TumApplyJpaRepository<ApplicationReview, UUID> {
    List<ApplicationReview> findAllByReviewedBy(User reviewedBy);

    void deleteByApplicationIn(List<Application> applications);
}
