package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.evaluation.domain.ApplicationReview;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the {@link ApplicationReview} entity.
 */
@Repository
public interface ApplicationReviewRepository extends JpaRepository<ApplicationReview, UUID> {}
