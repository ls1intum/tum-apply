package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends TumApplyJpaRepository<Document, UUID> {
    Optional<Document> findBySha256Id(String sha256Id);

    void deleteByUploadedBy(User uploadedBy);
}
