package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.core.dto.EmailTemplateGroupDTO;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailTemplateRepository extends TumApplyJpaRepository<EmailTemplate, UUID> {
    List<EmailTemplate> findAllByEmailTypeAndTemplateNameAndResearchGroup(
        EmailType emailType,
        String templateName,
        ResearchGroup researchGroup
    );

    Optional<EmailTemplate> findByResearchGroupAndLanguageAndTemplateNameAndEmailType(
        ResearchGroup researchGroup,
        Language language,
        String templateName,
        EmailType emailType
    );

    boolean existsByResearchGroupAndLanguageAndTemplateNameAndEmailType(
        ResearchGroup researchGroup,
        Language language,
        String templateName,
        EmailType emailType
    );

    @Query(
        value = """
        SELECT new de.tum.cit.aet.core.dto.EmailTemplateGroupDTO(
            et.templateName,
            et.emailType,
            u.firstName,
            u.lastName,
            et.isDefault
        )
        FROM EmailTemplate et
        LEFT JOIN et.createdBy u
        WHERE et.researchGroup.researchGroupId = :researchGroupId
        GROUP BY
            et.templateName,
            et.emailType,
            et.isDefault,
            et.researchGroup,
            et.createdBy,
            u.firstName,
            u.lastName
        """
    )
    Page<EmailTemplateGroupDTO> findGroupedTemplatesByResearchGroupId(@Param("researchGroupId") UUID researchGroupId, Pageable pageable);
}
