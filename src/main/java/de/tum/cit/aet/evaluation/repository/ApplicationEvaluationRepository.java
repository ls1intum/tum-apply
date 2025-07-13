package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.repository.custom.ApplicationEvaluationRepositoryCustom;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface ApplicationEvaluationRepository extends TumApplyJpaRepository<Application, UUID>, ApplicationEvaluationRepositoryCustom {
    /**
     * Marks the application as IN_REVIEW if its current state is SENT.
     *
     * @param applicationId the ID of the application to update
     */
    @Transactional
    @Modifying
    @Query(
        """
            UPDATE Application a
            SET a.state = 'IN_REVIEW'
            WHERE a.state = 'SENT'
            AND a.applicationId = :applicationId
        """
    )
    void markApplicationAsInReview(@Param("applicationId") UUID applicationId);
}
