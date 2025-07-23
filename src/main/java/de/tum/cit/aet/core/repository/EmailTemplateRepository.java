package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailTemplateRepository extends TumApplyJpaRepository<EmailTemplate, UUID> {
    List<EmailTemplate> findAllByResearchGroup(ResearchGroup researchGroup);
}
