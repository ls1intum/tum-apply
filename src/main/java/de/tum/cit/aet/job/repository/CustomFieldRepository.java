package de.tum.cit.aet.job.repository;

import de.tum.cit.aet.job.domain.CustomField;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomFieldRepository extends JpaRepository<CustomField, UUID> {}
