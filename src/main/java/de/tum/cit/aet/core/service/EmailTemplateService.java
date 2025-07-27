package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.core.domain.EmailTemplateTranslation;
import de.tum.cit.aet.core.domain.EmailTemplate_;
import de.tum.cit.aet.core.dto.EmailTemplateDTO;
import de.tum.cit.aet.core.dto.EmailTemplateGroupDTO;
import de.tum.cit.aet.core.dto.EmailTemplateTranslationDTO;
import de.tum.cit.aet.core.dto.PageDTO;
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
import lombok.AllArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@AllArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;


    private EmailTemplate get(ResearchGroup researchGroup,
                              String templateName,
                              EmailType emailType) {
        addMissingTemplates(researchGroup);

        return emailTemplateRepository
                .findByResearchGroupAndTemplateNameAndEmailType(researchGroup, templateName, emailType)
                .orElseThrow(() ->
                        EntityNotFoundException.forId("EmailTemplate",
                                researchGroup.getResearchGroupId(), templateName, emailType));
    }

    private EmailTemplate get(UUID emailTemplateId) {
        return emailTemplateRepository
                .findById(emailTemplateId)
                .orElseThrow(() ->
                        EntityNotFoundException.forId("EmailTemplate",
                                emailTemplateId));
    }

    public EmailTemplateTranslation getTemplateTranslation(ResearchGroup researchGroup, String templateName, EmailType emailType, Language language) {
        EmailTemplate emailTemplate = get(researchGroup, templateName, emailType);
        return getTranslation(emailTemplate, language);
    }

    public List<EmailTemplateGroupDTO> getGroupedTemplates(ResearchGroup researchGroup, PageDTO pageDTO) {
        addMissingTemplates(researchGroup);

        Pageable pageable = PageRequest.of(
                pageDTO.pageNumber(),
                pageDTO.pageSize(),
                Sort.by(EmailTemplate_.IS_DEFAULT).ascending()
                        .and(Sort.by(EmailTemplate_.TEMPLATE_NAME).ascending())
        );
        return emailTemplateRepository.findAllByResearchGroup(researchGroup, pageable).toList();
    }

    public EmailTemplateDTO getTemplate(UUID templateId) {
        return toDTOWithQuillMentions(get(templateId));
    }

    public EmailTemplateDTO createTemplates(EmailTemplateDTO dto,
                                            ResearchGroup researchGroup,
                                            User createdBy) {

        if (!dto.emailType().isMultipleTemplates()) {
            // Creating another logical template for a single-template type is not allowed
            throw new IllegalArgumentException("Cannot create another template of type: " + dto.emailType());
        }

        EmailTemplate template = new EmailTemplate();
        template.setResearchGroup(researchGroup);
        template.setCreatedBy(createdBy);
        template.setEmailType(dto.emailType());
        template.setTemplateName(dto.templateName());
        template.setDefault(false); //always false for manually created templates

        if (dto.english() != null) {
            template.getTranslations().add(fromDTO(dto.english(), Language.ENGLISH, template));
        }
        if (dto.german() != null) {
            template.getTranslations().add(fromDTO(dto.german(), Language.GERMAN, template));
        }

        try {
            return toDTOWithQuillMentions(emailTemplateRepository.save(template));
        }
        catch (DataIntegrityViolationException e) {
            throw new ResourceAlreadyExistsException(String.format("Template \"%s'\" already exists", template.getTemplateName()));
        }
    }

    /**
     * Updates logical templates and their translations from DTOs.
     */
    public EmailTemplateDTO updateTemplate(EmailTemplateDTO dto) {
        EmailTemplate template = emailTemplateRepository
                .findById(dto.emailTemplateId())
                .orElseThrow(() -> EntityNotFoundException.forId("EmailTemplate", dto.emailTemplateId()));

        if (!template.getEmailType().isTemplateEditable()) {
            throw new EmailTemplateException("EmailTemplate " + dto.emailTemplateId() + " is not editable");
        }

        // Update parent fields
        template.setTemplateName(dto.templateName());

        // Update translations if present in DTO
        if (dto.english() != null) {
            upsertTranslationFromDTO(template, dto.english(), Language.ENGLISH);
        }
        if (dto.german() != null) {
            upsertTranslationFromDTO(template, dto.german(), Language.GERMAN);
        }

        return toDTOWithQuillMentions(emailTemplateRepository.save(template));
    }

    public void deleteTemplate(UUID templateId) {
        EmailTemplate toDelete = get(templateId);

        if (toDelete.isDefault()) {
            throw new EmailTemplateException("Default templates cannot be deleted");
        }

        emailTemplateRepository.delete(toDelete);
    }

    /* -------------------- defaults / seeding -------------------- */

    private void addMissingTemplates(ResearchGroup researchGroup) {
        Set<EmailTemplate> toSave = new HashSet<>();

        for (EmailType emailType : EmailType.values()) {
            if (emailType.equals(EmailType.APPLICATION_REJECTED)) {
                for (RejectReason reason : RejectReason.values()) {
                    String name = reason.getValue();
                    if (!emailTemplateRepository.existsByResearchGroupAndTemplateNameAndEmailType(researchGroup, name, emailType)) {
                        EmailTemplate template = createDefaultTemplate(researchGroup, name, emailType);
                        toSave.add(template);
                    }
                }
            } else {
                if (!emailTemplateRepository.existsByResearchGroupAndTemplateNameAndEmailType(researchGroup, null, emailType)) {
                    EmailTemplate template = createDefaultTemplate(researchGroup, null, emailType);
                    toSave.add(template);
                }
            }
        }

        if (!toSave.isEmpty()) {
            emailTemplateRepository.saveAll(toSave);
        }
    }

    private EmailTemplate createDefaultTemplate(ResearchGroup group, String templateName, EmailType emailType) {
        EmailTemplate template = new EmailTemplate();
        template.setResearchGroup(group);
        template.setTemplateName(templateName);
        template.setEmailType(emailType);
        template.setDefault(true);
        template.setCreatedBy(null);

        // Ensure both translations
        attachTranslation(template, createDefaultTranslation(template, Language.ENGLISH));
        attachTranslation(template, createDefaultTranslation(template, Language.GERMAN));

        return template;
    }

    private EmailTemplateTranslation createDefaultTranslation(EmailTemplate parent, Language language) {
        // path e.g. "en/APPLICATION_RECEIVED_subject.html" and "en/APPLICATION_RECEIVED[-reason].html"
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

    /* -------------------- mapping / helpers -------------------- */

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

    private EmailTemplateTranslation fromDTO(EmailTemplateTranslationDTO dto, Language lang, EmailTemplate parent) {
        EmailTemplateTranslation tr = new EmailTemplateTranslation();
        tr.setEmailTemplate(parent);
        tr.setLanguage(lang);
        tr.setSubject(dto.subject());

        String sanitizedBody = HtmlSanitizer.sanitizeQuillMentions(dto.body());
        tr.setBodyHtml(TemplateUtil.convertQuillMentionsToFreemarker(sanitizedBody));
        return tr;
    }

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

    private EmailTemplateTranslation translationWithQuillMentions(EmailTemplateTranslation tr) {
        if (tr == null) return null;
        // Convert body to Quill mentions for UI responses
        EmailTemplateTranslation copy = new EmailTemplateTranslation();
        copy.setLanguage(tr.getLanguage());
        copy.setSubject(tr.getSubject());
        copy.setBodyHtml(TemplateUtil.convertFreemarkerToQuillMentions(tr.getBodyHtml()));
        return copy;
    }

    private EmailTemplateTranslation getTranslation(EmailTemplate template, Language language) {
        return template.getTranslations().stream()
                .filter(t -> t.getLanguage() == language)
                .findFirst()
                .orElse(null);
    }

    private void attachTranslation(EmailTemplate parent, EmailTemplateTranslation translation) {
        parent.getTranslations().add(translation);
        translation.setEmailTemplate(parent);
    }

    private String readTemplateContent(String templatePath) {
        try {
            return new String(
                    Objects.requireNonNull(
                            getClass().getClassLoader().getResourceAsStream("templates/" + templatePath)
                    ).readAllBytes()
            );
        } catch (IOException e) {
            throw new TemplateProcessingException("Failed to read template file: " + templatePath, e);
        }
    }
}
