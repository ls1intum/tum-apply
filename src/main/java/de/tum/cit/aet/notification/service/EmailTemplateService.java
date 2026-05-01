package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.exception.EmailTemplateException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.ResourceAlreadyExistsException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.core.util.TemplateUtil;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.domain.EmailTemplate;
import de.tum.cit.aet.notification.dto.EmailTemplateDTO;
import de.tum.cit.aet.notification.dto.EmailTemplateOverviewDTO;
import de.tum.cit.aet.notification.dto.EmailTemplateTranslationDTO;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.notification.service.DefaultEmailTemplateProvider.DefaultContent;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.AllArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EmailTemplateService {

    /**
     * Resolved subject + body for a (group, type, language) lookup.
     */
    public record EmailContent(String subject, String bodyHtml) {}

    private final EmailTemplateRepository emailTemplateRepository;
    private final DefaultEmailTemplateProvider defaultProvider;
    private final CurrentUserService currentUserService;

    /**
     * Resolves the subject + body to use for the given research group, email type, and language.
     * Returns the customised content if a row exists, otherwise the system default loaded from resource files.
     */
    public EmailContent resolveContent(ResearchGroup researchGroup, EmailType emailType, Language language) {
        if (researchGroup != null) {
            EmailTemplate custom = emailTemplateRepository.findByResearchGroupAndEmailType(researchGroup, emailType).orElse(null);
            if (custom != null) {
                return contentFromCustom(custom, language);
            }
        }
        DefaultContent def = defaultProvider.load(emailType, language);
        return new EmailContent(def.subject(), def.bodyHtml());
    }

    /**
     * Returns the merged list of templates for the research group: customs first (most recent first),
     * then defaults loaded from resource files. Only EmailTypes flagged {@code customizable} are
     * included — system-only types (e.g. data deletion warnings, research group approval) are hidden.
     * Content is converted to Quill-mention form for the editor.
     */
    public List<EmailTemplateOverviewDTO> listMerged(ResearchGroup researchGroup) {
        Map<EmailType, EmailTemplate> customs = emailTemplateRepository
            .findAllByResearchGroup(researchGroup)
            .stream()
            .filter(t -> t.getEmailType().isCustomizable())
            .collect(Collectors.toMap(EmailTemplate::getEmailType, Function.identity()));

        Stream<EmailTemplateOverviewDTO> customRows = customs
            .values()
            .stream()
            .sorted(Comparator.comparing(EmailTemplate::getLastModifiedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toOverviewCustom);

        Stream<EmailTemplateOverviewDTO> defaultRows = java.util.Arrays.stream(EmailType.values())
            .filter(EmailType::isCustomizable)
            .filter(type -> !customs.containsKey(type))
            .map(this::toOverviewDefault);

        return Stream.concat(customRows, defaultRows).toList();
    }

    /**
     * Retrieves a custom template by its ID. Throws if the template does not exist.
     */
    public EmailTemplateDTO getTemplate(UUID templateId) {
        EmailTemplate template = findById(templateId);
        currentUserService.assertAccessTo(template);
        return toDTOForEditing(template);
    }

    /**
     * Creates a new custom template for the (group, emailType) pair.
     * Throws {@link ResourceAlreadyExistsException} if a custom already exists for this pair.
     * Throws {@link EmailTemplateException} if the EmailType is not customizable per research group.
     */
    public EmailTemplateDTO createTemplate(EmailTemplateDTO dto, ResearchGroup researchGroup, User createdBy) {
        if (!dto.emailType().isCustomizable()) {
            throw new EmailTemplateException(String.format("EmailType %s cannot be customised per research group", dto.emailType()));
        }
        if (emailTemplateRepository.existsByResearchGroupAndEmailType(researchGroup, dto.emailType())) {
            throw new ResourceAlreadyExistsException(
                String.format("Custom template for emailType %s already exists in this research group", dto.emailType())
            );
        }

        EmailTemplate template = new EmailTemplate();
        template.setResearchGroup(researchGroup);
        template.setCreatedBy(createdBy);
        template.setEmailType(dto.emailType());
        applyContent(template, dto);

        try {
            return toDTOForEditing(emailTemplateRepository.save(template));
        } catch (DataIntegrityViolationException e) {
            throw new ResourceAlreadyExistsException(
                String.format("Custom template for emailType %s already exists in this research group", dto.emailType())
            );
        }
    }

    /**
     * Updates content of an existing custom template. EmailType may be changed to another customizable type
     * as long as no other custom row already exists for the new (group, emailType) pair.
     */
    public EmailTemplateDTO updateTemplate(EmailTemplateDTO dto) {
        EmailTemplate template = findById(dto.emailTemplateId());
        currentUserService.assertAccessTo(template);

        if (dto.emailType() != template.getEmailType()) {
            if (!dto.emailType().isCustomizable()) {
                throw new EmailTemplateException(String.format("EmailType %s cannot be customised per research group", dto.emailType()));
            }
            if (emailTemplateRepository.existsByResearchGroupAndEmailType(template.getResearchGroup(), dto.emailType())) {
                throw new ResourceAlreadyExistsException(
                    String.format("Custom template for emailType %s already exists in this research group", dto.emailType())
                );
            }
            template.setEmailType(dto.emailType());
        }

        applyContent(template, dto);
        template.setLastModifiedAt(java.time.LocalDateTime.now(java.time.ZoneOffset.UTC));

        try {
            return toDTOForEditing(emailTemplateRepository.save(template));
        } catch (DataIntegrityViolationException e) {
            throw new ResourceAlreadyExistsException(
                String.format("Custom template for emailType %s already exists in this research group", dto.emailType())
            );
        }
    }

    /**
     * Deletes a custom template. The system default (loaded from resource files) takes its place automatically.
     */
    public void deleteTemplate(UUID templateId) {
        EmailTemplate toDelete = findById(templateId);
        currentUserService.assertAccessTo(toDelete);
        emailTemplateRepository.delete(toDelete);
    }

    private EmailTemplate findById(UUID id) {
        return emailTemplateRepository.findById(id).orElseThrow(() -> EntityNotFoundException.forId("EmailTemplate", id));
    }

    private EmailContent contentFromCustom(EmailTemplate t, Language language) {
        return switch (language) {
            case ENGLISH -> new EmailContent(t.getSubjectEn(), t.getBodyHtmlEn());
            case GERMAN -> new EmailContent(t.getSubjectDe(), t.getBodyHtmlDe());
        };
    }

    private EmailTemplateOverviewDTO toOverviewCustom(EmailTemplate t) {
        return new EmailTemplateOverviewDTO(
            t.getEmailTemplateId(),
            t.getEmailType(),
            true,
            new EmailTemplateTranslationDTO(t.getSubjectEn(), toQuill(t.getBodyHtmlEn())),
            new EmailTemplateTranslationDTO(t.getSubjectDe(), toQuill(t.getBodyHtmlDe())),
            t.getCreatedBy() != null ? t.getCreatedBy().getFirstName() : null,
            t.getCreatedBy() != null ? t.getCreatedBy().getLastName() : null,
            t.getLastModifiedAt() != null ? t.getLastModifiedAt().toInstant(java.time.ZoneOffset.UTC) : null
        );
    }

    private EmailTemplateOverviewDTO toOverviewDefault(EmailType emailType) {
        DefaultContent en = defaultProvider.load(emailType, Language.ENGLISH);
        DefaultContent de = defaultProvider.load(emailType, Language.GERMAN);
        return new EmailTemplateOverviewDTO(
            null,
            emailType,
            false,
            new EmailTemplateTranslationDTO(en.subject(), toQuill(en.bodyHtml())),
            new EmailTemplateTranslationDTO(de.subject(), toQuill(de.bodyHtml())),
            null,
            null,
            null
        );
    }

    private EmailTemplateDTO toDTOForEditing(EmailTemplate t) {
        return new EmailTemplateDTO(
            t.getEmailTemplateId(),
            t.getEmailType(),
            new EmailTemplateTranslationDTO(t.getSubjectEn(), toQuill(t.getBodyHtmlEn())),
            new EmailTemplateTranslationDTO(t.getSubjectDe(), toQuill(t.getBodyHtmlDe()))
        );
    }

    private void applyContent(EmailTemplate t, EmailTemplateDTO dto) {
        if (dto.english() == null || dto.german() == null) {
            throw new EmailTemplateException("Both English and German content are required");
        }
        t.setSubjectEn(dto.english().subject());
        t.setBodyHtmlEn(toFreemarker(dto.english().body()));
        t.setSubjectDe(dto.german().subject());
        t.setBodyHtmlDe(toFreemarker(dto.german().body()));
    }

    private static String toFreemarker(String html) {
        String sanitized = HtmlSanitizer.sanitizeQuillMentions(html);
        return TemplateUtil.convertQuillMentionsToFreemarker(sanitized);
    }

    private static String toQuill(String html) {
        return TemplateUtil.convertFreemarkerToQuillMentions(html);
    }
}
