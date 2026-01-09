package de.tum.cit.aet.application.repository;

import de.tum.cit.aet.application.domain.CustomFieldAnswer;
import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface CustomFieldAnswerRepository extends TumApplyJpaRepository<CustomFieldAnswer, UUID> {
    @Modifying
    @Transactional
    @Query("DELETE FROM CustomFieldAnswer c WHERE c.application.applicationId = :applicationId")
    void deleteByApplicationId(@Param("applicationId") UUID applicationId);
}
