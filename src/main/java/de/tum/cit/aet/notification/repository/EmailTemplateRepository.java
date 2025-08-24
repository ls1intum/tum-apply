package de.tum.cit.aet.notification.repository;

import de.tum.cit.aet.core.repository.TumApplyJpaRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.dto.EmailTemplateOverviewDTO;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailTemplateRepository extends TumApplyJpaRepository<EmailTemplate, UUID> {
    /**
     * Retrieves an {@link EmailTemplate} by its ID, eagerly loading its translations.
     *
     * @param id the unique identifier of the email template; must not be null
     * @return an {@link Optional} containing the email template if found, or empty otherwise
     */
    @Query(
        """
            SELECT et FROM EmailTemplate et
            LEFT JOIN FETCH et.translations t
            WHERE et.emailTemplateId = :id
        """
    )
    Optional<EmailTemplate> findWithTranslationsById(@Param("id") @NotNull UUID id);

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
        ResearchGroup researchGroup,
        String templateName,
        EmailType emailType
    );

    /**
     * Retrieves a paginated list of {@link EmailTemplateOverviewDTO} projections for the given research group,
     * filtering by the provided set of editable email types.
     *
     * @param researchGroup      the research group whose templates should be listed
     * @param editableEmailTypes a set of email types to filter the templates by
     * @param pageable           the pagination and sorting information
     * @return a {@link Page} of {@link EmailTemplateOverviewDTO} containing template metadata
     */
    @Query(
        """
            SELECT new de.tum.cit.aet.notification.dto.EmailTemplateOverviewDTO(
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
        """
    )
    Page<EmailTemplateOverviewDTO> findOverviewByResearchGroupAndEmailTypeIn(
        @Param("researchGroup") ResearchGroup researchGroup,
        @Param("editableEmailTypes") Set<EmailType> editableEmailTypes,
        Pageable pageable
    );

    /**
     * Retrieves all distinct {@link EmailType} values for which email templates
     * exist within a given {@link ResearchGroup}.
     *
     * @param researchGroup the research group to search templates for; must not be {@code null}
     * @return a {@link Set} of {@link EmailType} values for which templates already exist
     */
    @Query(
        """
            SELECT DISTINCT et.emailType
            FROM EmailTemplate et
            WHERE et.researchGroup = :researchGroup
        """
    )
    Set<EmailType> findAllEmailTypesByResearchGroup(@Param("researchGroup") ResearchGroup researchGroup);
}
