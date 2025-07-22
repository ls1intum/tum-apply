package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.domain.EmailTemplate;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailTemplateRepository extends TumApplyJpaRepository<EmailTemplate, UUID> {}
