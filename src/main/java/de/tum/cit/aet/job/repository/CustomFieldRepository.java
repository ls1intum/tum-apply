package de.tum.cit.aet.job.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.job.domain.CustomField;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomFieldRepository extends TumApplyJpaRepository<CustomField, UUID> {}
