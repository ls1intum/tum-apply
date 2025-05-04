package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.evaluation.domain.InternalComment;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface InternalCommentRepository extends TumApplyJpaRepository<InternalComment, UUID> {}
