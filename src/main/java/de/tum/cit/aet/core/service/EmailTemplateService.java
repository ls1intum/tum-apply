package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.core.domain.EmailTemplateTranslation;
import de.tum.cit.aet.core.domain.EmailTemplate_;
import de.tum.cit.aet.core.dto.*;
import de.tum.cit.aet.core.exception.EmailTemplateException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.core.repository.EmailTemplateRepository;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.core.util.TemplateUtil;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.io.IOException;
import java.util.*;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final CurrentUserService currentUserService;

    private final Set<EmailType> editableEmailTypes = EmailType.getEditableEmailTypes();

    /**
     * Retrieves an {@link EmailTemplate} by research group, template name, and email type.
     * Creates missing default templates if necessary.
     *
     * @param researchGroup the research group associated with the template
     * @param templateName  the name of the template
     * @param emailType     the email type
     * @return the matching {@link EmailTemplate}
     * @throws EntityNotFoundException if no matching template is found
     */
    @Transactional // for write -> read
    protected EmailTemplate get(ResearchGroup researchGroup, String templateName, EmailType emailType) {
        addMissingTemplates(researchGroup);

        return emailTemplateRepository
            .findByResearchGroupAndTemplateNameAndEmailType(researchGroup, templateName, emailType)
            .orElseThrow(() -> EntityNotFoundException.forId("EmailTemplate", researchGroup.getResearchGroupId(), templateName, emailType));
    }

    /**
     * Retrieves an {@link EmailTemplate} by its unique ID.
     *
     * @param emailTemplateId the template ID
     * @return the matching {@link EmailTemplate}
     * @throws EntityNotFoundException if no template is found for the given ID
     */
    private EmailTemplate get(UUID emailTemplateId) {
        return emailTemplateRepository
            .findWithTranslationsById(emailTemplateId)
            .orElseThrow(() -> EntityNotFoundException.forId("EmailTemplate", emailTemplateId));
    }

    /**
     * Retrieves a specific {@link EmailTemplateTranslation} for a template,
     * based on research group, template name, email type, and language.
     *
     * @param researchGroup the research group associated with the template
     * @param templateName  the template name
     * @param emailType     the email type
     * @param language      the translation language
     * @return the matching {@link EmailTemplateTranslation}
     */
    @Transactional // for write -> read
    public EmailTemplateTranslation getTemplateTranslation(
        ResearchGroup researchGroup,
        String templateName,
        EmailType emailType,
        Language language
    ) {
        EmailTemplate emailTemplate = get(researchGroup, templateName, emailType);
        return getTranslation(emailTemplate, language);
    }

    /**
     * Retrieves a paginated list of template overview DTOs for a given research group.
     * Automatically ensures missing default templates are created.
     *
     * @param researchGroup the research group
     * @param pageDTO       the pagination settings
     * @return a PageResponseDTO of {@link EmailTemplateOverviewDTO}
     */
    @Transactional // for write -> read
    public PageResponseDTO<EmailTemplateOverviewDTO> getTemplates(ResearchGroup researchGroup, PageDTO pageDTO) {
        addMissingTemplates(researchGroup);

        Pageable pageable = PageRequest.of(
            pageDTO.pageNumber(),
            pageDTO.pageSize(),
            Sort.by(EmailTemplate_.IS_DEFAULT).ascending().and(Sort.by(EmailTemplate_.TEMPLATE_NAME).ascending())
        );
        Page<EmailTemplateOverviewDTO> page = emailTemplateRepository.findOverviewByResearchGroupAndEmailTypeIn(
            researchGroup,
            editableEmailTypes,
            pageable
        );
        return new PageResponseDTO<>(page.get().toList(), page.getTotalElements());
    }

    /**
     * Retrieves a template as a {@link EmailTemplateDTO}, including Quill mentions.
     *
     * @param templateId the template ID
     * @return the {@link EmailTemplateDTO}
     */
    public EmailTemplateDTO getTemplate(UUID templateId) {
        return toDTOWithQuillMentions(get(templateId));
    }

    /**
     * Creates a new email template with its translations.
     *
     * @param dto           the template data
     * @param researchGroup the research group for the template
     * @param createdBy     the user who creates the template
     * @return the created {@link EmailTemplateDTO}
     * @throws IllegalArgumentException       if the email type does not allow multiple templates
     * @throws ResourceAlreadyExistsException if a template with the same name already exists
     */
    public EmailTemplateDTO createTemplate(EmailTemplateDTO dto, ResearchGroup researchGroup, User createdBy) {
        if (!dto.emailType().isMultipleTemplates()) {
            throw new IllegalArgumentException("Cannot create another template of type: " + dto.emailType());
        }

        EmailTemplate template = new EmailTemplate();
        template.setResearchGroup(researchGroup);
        template.setCreatedBy(createdBy);
        template.setEmailType(dto.emailType());
        template.setTemplateName(dto.templateName());
        template.setDefault(false);

        if (dto.english() != null) {
            template.getTranslations().add(fromDTO(dto.english(), Language.ENGLISH, template));
        }
        if (dto.german() != null) {
            template.getTranslations().add(fromDTO(dto.german(), Language.GERMAN, template));
        }

        try {
            return toDTOWithQuillMentions(emailTemplateRepository.save(template));
        } catch (DataIntegrityViolationException e) {
            throw new ResourceAlreadyExistsException(String.format("Template \"%s'\" already exists", template.getTemplateName()));
        }
    }

    /**
     * Updates an existing template and its translations from the given DTO.
     *
     * @param dto the updated template data
     * @return the updated {@link EmailTemplateDTO}
     * @throws EntityNotFoundException if the template does not exist
     * @throws EmailTemplateException  if the template is not editable
     */
    public EmailTemplateDTO updateTemplate(EmailTemplateDTO dto) {
        EmailTemplate template = emailTemplateRepository
            .findWithTranslationsById(dto.emailTemplateId())
            .orElseThrow(() -> EntityNotFoundException.forId("EmailTemplate", dto.emailTemplateId()));

        // authorize if current user can update template
        currentUserService.assertAccessTo(template);

        if (!template.getEmailType().isTemplateEditable()) {
            throw new EmailTemplateException("EmailTemplate " + dto.emailTemplateId() + " is not editable");
        }

        template.setTemplateName(dto.templateName());

        if (dto.english() != null) {
            upsertTranslationFromDTO(template, dto.english(), Language.ENGLISH);
        }
        if (dto.german() != null) {
            upsertTranslationFromDTO(template, dto.german(), Language.GERMAN);
        }

        return toDTOWithQuillMentions(emailTemplateRepository.save(template));
    }

    /**
     * Deletes a template by its ID.
     *
     * @param templateId the template ID
     * @throws EmailTemplateException if the template is a default template
     */
    public void deleteTemplate(UUID templateId) {
        EmailTemplate toDelete = get(templateId);

        // authorize if current user can delete template
        currentUserService.assertAccessTo(toDelete);

        if (toDelete.isDefault()) {
            throw new EmailTemplateException("Default templates cannot be deleted");
        }

        emailTemplateRepository.delete(toDelete);
    }

    /**
     * Adds missing default templates for a given research group.
     *
     * @param researchGroup the research group
     */
    @Transactional // for write -> read
    protected void addMissingTemplates(ResearchGroup researchGroup) {
        Set<EmailTemplate> toSave = new HashSet<>();

        // Fetch existing EmailTypes already defined for the group
        Set<EmailType> existingEmailTypes = emailTemplateRepository.findAllEmailTypesByResearchGroup(researchGroup);

        // Only iterate over types that are missing
        for (EmailType emailType : EmailType.values()) {
            if (existingEmailTypes.contains(emailType)) {
                continue; // Skip already existing templates
            }

            if (emailType.equals(EmailType.APPLICATION_REJECTED)) {
                // Add one template for each reject reason
                for (RejectReason reason : RejectReason.values()) {
                    String name = reason.getValue();
                    EmailTemplate template = createDefaultTemplate(researchGroup, name, emailType);
                    toSave.add(template);
                }
            } else {
                // Create a single default template
                EmailTemplate template = createDefaultTemplate(researchGroup, null, emailType);
                toSave.add(template);
            }
        }

        if (!toSave.isEmpty()) {
            emailTemplateRepository.saveAll(toSave);
        }
    }

    /**
     * Creates a default email template for the given research group and email type.
     *
     * @param group        the research group
     * @param templateName the template name (nullable)
     * @param emailType    the email type
     * @return the created {@link EmailTemplate}
     */
    private EmailTemplate createDefaultTemplate(ResearchGroup group, String templateName, EmailType emailType) {
        EmailTemplate template = new EmailTemplate();
        template.setResearchGroup(group);
        template.setTemplateName(templateName);
        template.setEmailType(emailType);
        template.setDefault(true);
        template.setCreatedBy(null);

        attachTranslation(template, createDefaultTranslation(template, Language.ENGLISH));
        attachTranslation(template, createDefaultTranslation(template, Language.GERMAN));

        return template;
    }

    /**
     * Creates a default translation for the specified language and template.
     *
     * @param parent   the parent email template
     * @param language the language for the translation
     * @return the created {@link EmailTemplateTranslation}
     */
    private EmailTemplateTranslation createDefaultTranslation(EmailTemplate parent, Language language) {
        String base = language.getCode() + "/" + parent.getEmailType().getValue();
        String subject = readTemplateContent(base + "_subject.html");
        String bodyPath = base + (parent.getTemplateName() != null ? "-" + parent.getTemplateName() : "") + ".html";
        String bodyHtml = readTemplateContent(bodyPath);

        EmailTemplateTranslation tr = new EmailTemplateTranslation();
        tr.setEmailTemplate(parent);
        tr.setLanguage(language);
        tr.setSubject(subject);
        tr.setBodyHtml(bodyHtml);
        return tr;
    }

    /**
     * Converts an {@link EmailTemplate} to a {@link EmailTemplateDTO}, converting Freemarker variables to Quill mentions.
     *
     * @param template the email template
     * @return the corresponding {@link EmailTemplateDTO}
     */
    private EmailTemplateDTO toDTOWithQuillMentions(EmailTemplate template) {
        EmailTemplateTranslation en = translationWithQuillMentions(getTranslation(template, Language.ENGLISH));
        EmailTemplateTranslation de = translationWithQuillMentions(getTranslation(template, Language.GERMAN));

        return new EmailTemplateDTO(
            template.getEmailTemplateId(),
            template.getTemplateName(),
            template.getEmailType(),
            template.isDefault(),
            en != null ? new EmailTemplateTranslationDTO(en.getSubject(), en.getBodyHtml()) : null,
            de != null ? new EmailTemplateTranslationDTO(de.getSubject(), de.getBodyHtml()) : null
        );
    }

    /**
     * Creates an {@link EmailTemplateTranslation} entity from a DTO.
     *
     * @param dto    the translation DTO
     * @param lang   the translation language
     * @param parent the parent template
     * @return the created {@link EmailTemplateTranslation}
     */
    private EmailTemplateTranslation fromDTO(EmailTemplateTranslationDTO dto, Language lang, EmailTemplate parent) {
        EmailTemplateTranslation tr = new EmailTemplateTranslation();
        tr.setEmailTemplate(parent);
        tr.setLanguage(lang);
        tr.setSubject(dto.subject());

        String sanitizedBody = HtmlSanitizer.sanitizeQuillMentions(dto.body());
        tr.setBodyHtml(TemplateUtil.convertQuillMentionsToFreemarker(sanitizedBody));
        return tr;
    }

    /**
     * Updates or inserts a translation for a template based on the provided DTO.
     *
     * @param parent the parent template
     * @param dto    the translation DTO
     * @param lang   the language of the translation
     */
    private void upsertTranslationFromDTO(EmailTemplate parent, EmailTemplateTranslationDTO dto, Language lang) {
        EmailTemplateTranslation existing = getTranslation(parent, lang);
        String sanitizedBody = HtmlSanitizer.sanitizeQuillMentions(dto.body());
        String fmBody = TemplateUtil.convertQuillMentionsToFreemarker(sanitizedBody);

        if (existing == null) {
            EmailTemplateTranslation tr = new EmailTemplateTranslation();
            tr.setEmailTemplate(parent);
            tr.setLanguage(lang);
            tr.setSubject(dto.subject());
            tr.setBodyHtml(fmBody);
            attachTranslation(parent, tr);
        } else {
            existing.setSubject(dto.subject());
            existing.setBodyHtml(fmBody);
        }
    }

    /**
     * Converts a translation's body from Freemarker variables to Quill mentions.
     *
     * @param tr the translation
     * @return a copy of the translation with Quill mentions in its body
     */
    private EmailTemplateTranslation translationWithQuillMentions(EmailTemplateTranslation tr) {
        if (tr == null) {
            return null;
        }
        EmailTemplateTranslation copy = new EmailTemplateTranslation();
        copy.setLanguage(tr.getLanguage());
        copy.setSubject(tr.getSubject());
        copy.setBodyHtml(TemplateUtil.convertFreemarkerToQuillMentions(tr.getBodyHtml()));
        return copy;
    }

    /**
     * Retrieves a translation of a template for the specified language.
     *
     * @param template the template
     * @param language the language
     * @return the matching translation or null if not found
     */
    private EmailTemplateTranslation getTranslation(EmailTemplate template, Language language) {
        return template
            .getTranslations()
            .stream()
            .filter(t -> t.getLanguage() == language)
            .findFirst()
            .orElse(null);
    }

    /**
     * Attaches a translation to its parent template.
     *
     * @param parent      the parent template
     * @param translation the translation to attach
     */
    private void attachTranslation(EmailTemplate parent, EmailTemplateTranslation translation) {
        parent.getTranslations().add(translation);
        translation.setEmailTemplate(parent);
    }

    /**
     * Reads the content of a template file from the resources/templates directory.
     *
     * @param templatePath the relative path to the template file
     * @return the file content as a string
     * @throws TemplateProcessingException if the template file cannot be read
     */
    private String readTemplateContent(String templatePath) {
        try {
            return new String(
                Objects.requireNonNull(getClass().getClassLoader().getResourceAsStream("templates/" + templatePath)).readAllBytes()
            );
        } catch (IOException e) {
            throw new TemplateProcessingException("Failed to read template file: " + templatePath, e);
        }
    }
}
