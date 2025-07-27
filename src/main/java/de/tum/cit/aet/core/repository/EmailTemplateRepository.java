package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.core.dto.EmailTemplateGroupDTO;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends TumApplyJpaRepository<EmailTemplate, UUID> {

    @NotNull
    @EntityGraph(attributePaths = "translations")
    Optional<EmailTemplate> findById(@NotNull UUID id);

    @EntityGraph(attributePaths = "translations")
    Optional<EmailTemplate> findByResearchGroupAndTemplateNameAndEmailType(
            ResearchGroup researchGroup, String templateName, EmailType emailType);

    boolean existsByResearchGroupAndTemplateNameAndEmailType(
            ResearchGroup researchGroup, String templateName, EmailType emailType);


    @Query("""
                SELECT new de.tum.cit.aet.core.dto.EmailTemplateGroupDTO(
                    et.emailTemplateId,
                    et.templateName,
                    et.emailType,
                    u.firstName,
                    u.lastName,
                    et.isDefault
                )
                FROM EmailTemplate et
                LEFT JOIN et.createdBy u
                WHERE et.researchGroup = :researchGroup
            """)
    Page<EmailTemplateGroupDTO> findAllByResearchGroup(@Param("researchGroup") ResearchGroup researchGroup, Pageable pageable);

}
