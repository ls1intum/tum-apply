package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends TumApplyJpaRepository<Document, UUID> {
    Optional<Document> findBySha256Id(String sha256Id);

    @Query("select d from Document d where d.uploadedBy.userId = :userId")
    List<Document> findByUploadedByUserId(@Param("userId") UUID userId);

    void deleteByUploadedBy(User uploadedBy);
}
