package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.domain.Document;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface DocumentRepository extends TumApplyJpaRepository<Document, UUID> {
    Optional<Document> findBySha256Id(String sha256Id);

    @Modifying
    @Transactional
    @Query("DELETE FROM Document d WHERE d.uploadedBy.userId = :userId")
    void deleteByUploadedBy(@Param("userId") UUID userId);
}
