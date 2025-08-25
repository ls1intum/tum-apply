package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InternalCommentRepository extends TumApplyJpaRepository<InternalComment, UUID> {

    List<InternalComment> findAllByApplicationApplicationIdOrderByCreatedAtAsc(UUID applicationId);
}
