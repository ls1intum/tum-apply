package de.tum.cit.aet.evaluation.repository;

import de.tum.cit.aet.evaluation.domain.InternalComment;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InternalCommentRepository extends JpaRepository<InternalComment, UUID> {}
