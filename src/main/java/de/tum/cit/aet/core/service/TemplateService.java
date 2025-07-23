package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.EmailType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.core.dto.EmailTemplateDTO;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.core.repository.EmailTemplateRepository;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.evaluation.constants.RejectReason;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.io.StringWriter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.NonNull;
import org.jetbrains.annotations.NotNull;
import org.jsoup.Jsoup;
import org.jsoup.nodes.*;
import org.jsoup.select.NodeVisitor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TemplateService {

    private final Configuration freemarkerConfig;
    private final EmailTemplateRepository emailTemplateRepository;

    @Value("${aet.client.url}")
    private String url;

    public TemplateService(Configuration freemarkerConfig, EmailTemplateRepository emailTemplateRepository) {
        this.freemarkerConfig = freemarkerConfig;
        this.emailTemplateRepository = emailTemplateRepository;
    }

    /**
     * Renders the subject line of an email using a FreeMarker subject template.
     *
     * @param templateName name of the template without suffix
     * @param language     language to use for rendering
     * @param content      data model for placeholder values
     * @return rendered subject line as string
     */
    public String renderSubject(@NonNull String templateName, @NonNull Language language, @NonNull Map<String, Object> content) {
        String templatePath = language.getCode() + "/" + templateName + "_subject.ftl";
        try (StringWriter writer = new StringWriter()) {
            Template template = freemarkerConfig.getTemplate(templatePath);
            template.process(content, writer);
            return "TUMApply – " + writer.toString().trim();
        } catch (IOException e) {
            // Subject template not found
            throw new TemplateProcessingException("Failed to load subject template: " + templatePath, e);
        } catch (TemplateException e) {
            throw new TemplateProcessingException("Failed to render subject template: " + templateName, e);
        }
    }

    /**
     * Renders an HTML email template with the given content and language.
     *
     * @param templateName name of the template (without .ftl)
     * @param language     language to use for rendering
     * @param content      data model for placeholder values
     * @return rendered HTML string
     */
    public String renderTemplate(@NonNull String templateName, @NonNull Language language, @NonNull Map<String, Object> content) {
        Map<String, Object> dataModel = new HashMap<>(content);
        try {
            Template template = freemarkerConfig.getTemplate(language.getCode() + "/" + templateName + ".ftl");

            addMetaData(language, dataModel);
            return render(template, dataModel);
        } catch (IOException ex) {
            throw new TemplateProcessingException(
                "Failed to load FreeMarker template: " + templateName + " for language: " + language.getCode(),
                ex
            );
        }
    }

    /**
     * Wraps raw HTML content into the styled email layout using the "raw" template.
     *
     * @param language language to use for layout/footer
     * @param html     sanitized raw HTML content
     * @return rendered HTML string
     */
    public String renderRawTemplate(@NonNull Language language, String html) {
        try {
            Template template = freemarkerConfig.getTemplate("base/raw.ftl");

            Map<String, Object> dataModel = new HashMap<>();
            dataModel.put("bodyHtml", HtmlSanitizer.sanitize(html));

            addMetaData(language, dataModel);
            return render(template, dataModel);
        } catch (IOException ex) {
            throw new TemplateProcessingException("Failed to load raw FreeMarker template", ex);
        }
    }

    /**
     * Processes the FreeMarker template with the given data model.
     *
     * @param template  the FreeMarker template
     * @param dataModel data model for template rendering
     * @return rendered template as string
     */
    private String render(Template template, Map<String, Object> dataModel) {
        try (StringWriter writer = new StringWriter()) {
            template.process(dataModel, writer);
            return writer.toString();
        } catch (IOException | TemplateException ex) {
            throw new TemplateProcessingException("Failed to render FreeMarker template '" + template.getName() + "'", ex);
        }
    }

    /**
     * Adds the language code and other metadata to the data model.
     *
     * @param language  language enum
     * @param dataModel model to which the language is added
     */
    private void addMetaData(Language language, Map<String, Object> dataModel) {
        dataModel.put("language", language.getCode());
        dataModel.put("url", url);
    }

    @Transactional
    public List<EmailTemplateDTO> getTemplates(ResearchGroup researchGroup) {
        List<EmailTemplate> emailTemplates = emailTemplateRepository.findAllByResearchGroup(researchGroup);

        if (emailTemplates.isEmpty()) {
            emailTemplates = createDefaultTemplates(researchGroup);
        }

        for (EmailTemplate emailTemplate : emailTemplates) {
            emailTemplate.setBodyHtml(convertFreemarkerToQuillMentions(emailTemplate.getBodyHtml()));
        }

        return emailTemplates.stream().map(EmailTemplateDTO::from).collect(Collectors.toList());
    }

    @Transactional
    protected List<EmailTemplate> createDefaultTemplates(ResearchGroup researchGroup) {
        Set<EmailTemplate> emailTemplatesToSave = new HashSet<>();

        for (EmailType emailType : EmailType.values()) {
            String templateName = emailType.name();

            for (Language language : Language.values()) {
                if (emailType.equals(EmailType.APPLICATION_REJECTED)) {
                    for (RejectReason reason : RejectReason.values()) {
                        EmailTemplate emailTemplate = createEmailTemplate(
                            researchGroup,
                            templateName,
                            language,
                            emailType,
                            reason.getValue()
                        );
                        emailTemplatesToSave.add(emailTemplate);
                    }
                } else {
                    EmailTemplate emailTemplate = createEmailTemplate(researchGroup, templateName, language, emailType, null);
                    emailTemplatesToSave.add(emailTemplate);
                }
            }
        }
        return emailTemplateRepository.saveAll(emailTemplatesToSave);
    }

    private EmailTemplate createEmailTemplate(
        ResearchGroup researchGroup,
        String templateName,
        Language language,
        EmailType emailType,
        String emailCase
    ) {
        EmailTemplate emailTemplate = new EmailTemplate();
        emailTemplate.setResearchGroup(researchGroup);
        emailTemplate.setTemplateName(templateName);
        emailTemplate.setLanguage(language);
        emailTemplate.setEmailType(emailType);
        emailTemplate.setEmailCase(emailCase);
        emailTemplate.setDefault(true);
        emailTemplate.setLastModifiedBy(null); // Default templates have no modifier

        // Read subject from template file
        String subject = readTemplateContent(language.getCode() + "/" + templateName + "_subject.html");
        emailTemplate.setSubject(subject);

        // Append case if present
        templateName += emailCase != null ? "-" + emailCase : "";

        // Read body from template file
        String bodyHtml = readTemplateContent(language.getCode() + "/" + templateName + ".html");
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

    private static final Pattern FREEMARKER_VAR_PATTERN = Pattern.compile("\\$\\{\\s*([a-zA-Z0-9_]+)!?}");

    public String convertFreemarkerToQuillMentions(String html) {
        Document doc = Jsoup.parse(html);
        doc.outputSettings().prettyPrint(false); // Keep original formatting

        doc
            .body()
            .traverse(
                new NodeVisitor() {
                    public void head(@NotNull Node node, int depth) {
                        if (node instanceof TextNode textNode) {
                            Element parent = (Element) textNode.parent();

                            // Skip if inside existing <span class="mention"> or any <a> attributes
                            if (parent != null && (parent.hasClass("mention") || parent.tagName().equals("a"))) return;

                            // Replace freemarker vars in visible text
                            String text = textNode.getWholeText();
                            Matcher matcher = FREEMARKER_VAR_PATTERN.matcher(text);
                            StringBuilder sb = new StringBuilder();

                            while (matcher.find()) {
                                String variable = matcher.group(1);
                                String displayValue = getDisplayName(variable);

                                String mentionSpan = String.format(
                                    "<span class=\"mention\" data-id=\"%s\" data-value=\"%s\" contenteditable=\"false\">%s</span>",
                                    variable,
                                    displayValue,
                                    displayValue
                                );

                                matcher.appendReplacement(sb, Matcher.quoteReplacement(mentionSpan));
                            }

                            matcher.appendTail(sb);

                            // Replace original text node with spanified version
                            if (!sb.toString().equals(text)) {
                                List<Node> nodes = Jsoup.parse(sb.toString()).body().childNodes();
                                for (Node n : nodes) {
                                    textNode.before(n);
                                }
                                textNode.remove();
                            }
                        }

                        // Skip freemarker vars in attribute values
                        if (node instanceof Element element) {
                            for (Attribute attr : element.attributes()) {
                                // Skip replacements inside attributes
                                if (FREEMARKER_VAR_PATTERN.matcher(attr.getValue()).find()) {
                                    // Optionally log or warn
                                    // System.out.println("Skipped var in attribute: " + attr.getValue());
                                }
                            }
                        }
                    }

                    public void tail(Node node, int depth) {}
                }
            );

        return doc.body().html();
    }

    private String getDisplayName(String key) {
        return switch (key) {
            case "applicantFirstName" -> "First Name";
            case "applicantLastName" -> "Last Name";
            case "jobTitle" -> "Job Title";
            case "researchGroupName" -> "Group Name";
            default -> key;
        };
    }
}
