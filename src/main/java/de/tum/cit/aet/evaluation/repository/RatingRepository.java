package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.domain.Rating;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RatingRepository extends TumApplyJpaRepository<Rating, UUID> {
    @Query(
        """
            SELECT r FROM Rating r
            LEFT JOIN FETCH r.from
            WHERE r.application.applicationId = :applicationId
        """
    )
    Set<Rating> findByApplicationApplicationId(@Param("applicationId") UUID applicationId);

    void deleteByFromAndApplicationApplicationId(User from, UUID applicationId);

    Optional<Rating> findByFromAndApplicationApplicationId(User from, UUID applicationId);
}
