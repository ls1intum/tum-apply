package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link ApplicationReview} entity.
 */
@Repository
public interface ApplicationReviewRepository extends TumApplyJpaRepository<ApplicationReview, UUID> {}
