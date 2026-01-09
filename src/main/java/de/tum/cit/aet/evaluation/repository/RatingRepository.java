package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.domain.Rating;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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

    Optional<Rating> findByFromAndApplicationApplicationId(User from, UUID applicationId);

    Set<Rating> findAllByFrom(User from);

    @Modifying
    @Transactional
    @Query("DELETE FROM Rating r WHERE r.application.applicationId = :applicationId")
    void deleteByApplicationId(@Param("applicationId") UUID applicationId);

    void deleteByFromAndApplicationApplicationId(User from, UUID applicationId);
}
