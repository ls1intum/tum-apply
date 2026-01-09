package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface InternalCommentRepository extends TumApplyJpaRepository<InternalComment, UUID> {
    List<InternalComment> findAllByApplicationApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    List<InternalComment> findAllByCreatedBy(User createdBy);

    @Modifying
    @Transactional
    @Query("DELETE FROM InternalComment ic WHERE ic.application.applicationId = :applicationId")
    void deleteByApplicationId(@Param("applicationId") UUID applicationId);
}
