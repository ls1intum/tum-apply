package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.core.domain.EmailTemplate_;
import de.tum.cit.aet.core.dto.EmailTemplateDTO;
import de.tum.cit.aet.core.dto.EmailTemplateGroupDTO;
import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.core.repository.EmailTemplateRepository;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.core.util.TemplateUtil;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;

    public EmailTemplate getTemplate(ResearchGroup researchGroup, Language language, String templateName, EmailType emailType) {
        addMissingTemplates(researchGroup);

        return emailTemplateRepository
            .findByResearchGroupAndLanguageAndTemplateNameAndEmailType(researchGroup, language, templateName, emailType)
            .orElseThrow(() ->
                EntityNotFoundException.forId("EmailTemplate", researchGroup.getResearchGroupId(), language, templateName, emailType)
            );
    }

    public List<EmailTemplateGroupDTO> getGroupedTemplates(ResearchGroup researchGroup, PageDTO pageDTO) {
        addMissingTemplates(researchGroup);

        Pageable pageable = PageRequest.of(
            pageDTO.pageNumber(),
            pageDTO.pageSize(),
            Sort.by(EmailTemplate_.IS_DEFAULT).ascending().and(Sort.by(EmailTemplate_.TEMPLATE_NAME).ascending())
        );
        return emailTemplateRepository.findGroupedTemplatesByResearchGroupId(researchGroup.getResearchGroupId(), pageable).get().toList();
    }

    public List<EmailTemplateDTO> getTemplates(EmailType emailType, String templateName, ResearchGroup researchGroup) {
        addMissingTemplates(researchGroup);
        List<EmailTemplate> emailTemplates = emailTemplateRepository.findAllByEmailTypeAndTemplateNameAndResearchGroup(
            emailType,
            templateName,
            researchGroup
        );

        for (EmailTemplate emailTemplate : emailTemplates) {
            emailTemplate.setBodyHtml(TemplateUtil.convertFreemarkerToQuillMentions(emailTemplate.getBodyHtml()));
        }
        return emailTemplates.stream().map(EmailTemplateDTO::from).collect(Collectors.toList());
    }

    public List<EmailTemplateDTO> createTemplates(List<EmailTemplateDTO> emailTemplateDTOs, ResearchGroup researchGroup, User createdBy) {
        Set<EmailTemplate> templatesToSave = new HashSet<>();

        for (EmailTemplateDTO emailTemplateDTO : emailTemplateDTOs) {
            EmailTemplate emailTemplate = new EmailTemplate();
            emailTemplate.setResearchGroup(researchGroup);
            emailTemplate.setCreatedBy(createdBy);
            emailTemplate.setEmailType(emailTemplateDTO.emailType());
            emailTemplate.setLanguage(emailTemplateDTO.language());

            applyUpdates(emailTemplateDTO, emailTemplate);

            if (!emailTemplateDTO.emailType().isMultipleTemplates()) {
                throw new IllegalArgumentException("Can not create another template of type: " + emailTemplateDTO.emailType());
            }

            templatesToSave.add(emailTemplate);
        }

        List<EmailTemplate> emailTemplates = emailTemplateRepository.saveAll(templatesToSave);
        for (EmailTemplate emailTemplate : emailTemplates) {
            emailTemplate.setBodyHtml(TemplateUtil.convertFreemarkerToQuillMentions(emailTemplate.getBodyHtml()));
        }
        return emailTemplates.stream().map(EmailTemplateDTO::from).toList();
    }

    public List<EmailTemplateDTO> updateTemplates(List<EmailTemplateDTO> emailTemplateDTOs) {
        Set<EmailTemplate> templatesToSave = new HashSet<>();
        for (EmailTemplateDTO emailTemplateDTO : emailTemplateDTOs) {
            EmailTemplate emailTemplate = emailTemplateRepository
                .findById(emailTemplateDTO.emailTemplateId())
                .orElseThrow(() -> EntityNotFoundException.forId("EmailTemplate", emailTemplateDTO.emailTemplateId()));

            if (!emailTemplate.getEmailType().isTemplateEditable()) {
                throw new IllegalArgumentException("EmailTemplate " + emailTemplateDTO.emailTemplateId() + " is not editable");
            }
            applyUpdates(emailTemplateDTO, emailTemplate);
            templatesToSave.add(emailTemplate);
        }

        List<EmailTemplate> emailTemplates = emailTemplateRepository.saveAll(templatesToSave);
        for (EmailTemplate emailTemplate : emailTemplates) {
            emailTemplate.setBodyHtml(TemplateUtil.convertFreemarkerToQuillMentions(emailTemplate.getBodyHtml()));
        }
        return emailTemplates.stream().map(EmailTemplateDTO::from).toList();
    }

    public void deleteTemplates(EmailType emailType, String templateName, ResearchGroup researchGroup) {
        List<EmailTemplate> templatesToDelete = emailTemplateRepository.findAllByEmailTypeAndTemplateNameAndResearchGroup(
            emailType,
            templateName,
            researchGroup
        );
        templatesToDelete.forEach(emailTemplate -> {
            if (emailTemplate.isDefault()) {
                throw new IllegalArgumentException("Default templates can not be deleted");
            }
        });
        emailTemplateRepository.deleteAll(templatesToDelete);
    }

    private void applyUpdates(EmailTemplateDTO emailTemplateDTO, EmailTemplate emailTemplate) {
        emailTemplate.setTemplateName(emailTemplateDTO.templateName());
        emailTemplate.setSubject(emailTemplateDTO.subject());

        String sanitizedBody = HtmlSanitizer.sanitizeQuillMentions(emailTemplateDTO.htmlBody());
        emailTemplate.setBodyHtml(TemplateUtil.convertQuillMentionsToFreemarker(sanitizedBody));
    }

    private void addMissingTemplates(ResearchGroup researchGroup) {
        Set<EmailTemplate> emailTemplatesToSave = new HashSet<>();

        for (EmailType emailType : EmailType.values()) {
            for (Language language : Language.values()) {
                if (emailType.equals(EmailType.APPLICATION_REJECTED)) {
                    for (RejectReason reason : RejectReason.values()) {
                        if (
                            !emailTemplateRepository.existsByResearchGroupAndLanguageAndTemplateNameAndEmailType(
                                researchGroup,
                                language,
                                reason.getValue(),
                                emailType
                            )
                        ) {
                            EmailTemplate emailTemplate = createDefaultTemplate(researchGroup, reason.getValue(), language, emailType);
                            emailTemplatesToSave.add(emailTemplate);
                        }
                    }
                } else {
                    if (
                        !emailTemplateRepository.existsByResearchGroupAndLanguageAndTemplateNameAndEmailType(
                            researchGroup,
                            language,
                            null,
                            emailType
                        )
                    ) {
                        EmailTemplate emailTemplate = createDefaultTemplate(researchGroup, null, language, emailType);
                        emailTemplatesToSave.add(emailTemplate);
                    }
                }
            }
        }
        emailTemplateRepository.saveAll(emailTemplatesToSave);
    }

    private EmailTemplate createDefaultTemplate(ResearchGroup researchGroup, String templateName, Language language, EmailType emailType) {
        EmailTemplate emailTemplate = new EmailTemplate();
        emailTemplate.setResearchGroup(researchGroup);
        emailTemplate.setTemplateName(templateName);
        emailTemplate.setLanguage(language);
        emailTemplate.setEmailType(emailType);
        emailTemplate.setDefault(true);
        emailTemplate.setCreatedBy(null);

        String path = language.getCode() + "/" + emailType.getValue();

        // Read subject from template file
        String subject = readTemplateContent(path + "_subject.html");
        emailTemplate.setSubject(subject);

        // Append case if present
        path += templateName != null ? "-" + templateName : "";

        // Read body from template file
        String bodyHtml = readTemplateContent(path + ".html");
        emailTemplate.setBodyHtml(bodyHtml);

        return emailTemplate;
    }

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
