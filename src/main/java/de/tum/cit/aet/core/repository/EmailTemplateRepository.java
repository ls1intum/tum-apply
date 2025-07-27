package de.tum.cit.aet.core.repository;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.core.dto.EmailTemplateOverviewDTO;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Repository
public interface EmailTemplateRepository extends TumApplyJpaRepository<EmailTemplate, UUID> {

    /**
     * Retrieves an {@link EmailTemplate} by its ID, eagerly loading its translations.
     *
     * @param id the unique identifier of the email template; must not be null
     * @return an {@link Optional} containing the email template if found, or empty otherwise
     */
    @NotNull
    @EntityGraph(attributePaths = "translations")
    Optional<EmailTemplate> findById(@NotNull UUID id);


    /**
     * Finds an {@link EmailTemplate} by research group, template name, and email type,
     * eagerly loading its translations.
     *
     * @param researchGroup the research group associated with the template
     * @param templateName  the unique name of the template within the group
     * @param emailType     the type of email this template is used for
     * @return an {@link Optional} containing the matching email template, or empty if none found
     */
    @EntityGraph(attributePaths = "translations")
    Optional<EmailTemplate> findByResearchGroupAndTemplateNameAndEmailType(
            ResearchGroup researchGroup, String templateName, EmailType emailType);


    /**
     * Checks whether an {@link EmailTemplate} exists for the given research group,
     * template name, and email type.
     *
     * @param researchGroup the research group to check against
     * @param templateName  the name of the template
     * @param emailType     the type of email
     * @return {@code true} if a matching template exists, {@code false} otherwise
     */
    boolean existsByResearchGroupAndTemplateNameAndEmailType(
            ResearchGroup researchGroup, String templateName, EmailType emailType);


    /**
     * Retrieves a paginated list of {@link EmailTemplateOverviewDTO} projections for the given research group,
     * filtering by the provided set of editable email types.
     *
     * @param researchGroup      the research group whose templates should be listed
     * @param editableEmailTypes a set of email types to filter the templates by
     * @param pageable           the pagination and sorting information
     * @return a {@link Page} of {@link EmailTemplateOverviewDTO} containing template metadata
     */
    @Query("""
                SELECT new de.tum.cit.aet.core.dto.EmailTemplateOverviewDTO(
                    et.emailTemplateId,
                    et.templateName,
                    et.emailType,
                    u.firstName,
                    u.lastName,
                    et.isDefault
                )
                FROM EmailTemplate et
                LEFT JOIN et.createdBy u
                WHERE et.researchGroup = :researchGroup AND et.emailType IN (:editableEmailTypes)
            """)
    Page<EmailTemplateOverviewDTO> findAllByResearchGroup(@Param("researchGroup") ResearchGroup researchGroup, @Param("editableEmailTypes") Set<EmailType> editableEmailTypes, Pageable pageable);

}
