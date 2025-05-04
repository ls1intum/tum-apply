package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.domain.Document;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends TumApplyJpaRepository<Document, UUID> {}
