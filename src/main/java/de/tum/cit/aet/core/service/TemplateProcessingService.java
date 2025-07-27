package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.constants.TemplateVariable;
import de.tum.cit.aet.core.domain.EmailTemplateTranslation;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

@Service
public class TemplateProcessingService {

    private final Configuration freemarkerConfig;

    private static final String BASE_RAW_TEMPLATE = "base/raw.ftl";


    @Value("${aet.client.url}")
    private String url;

    public TemplateProcessingService(Configuration freemarkerConfig) {
        this.freemarkerConfig = freemarkerConfig;
    }

    public String renderSubject(EmailTemplateTranslation emailTemplateTranslation) {
        return "TUMApply - " + emailTemplateTranslation.getSubject();
    }

    /**
     * Renders a DB-backed FreeMarker template and wraps it in the base layout.
     * No sanitization is applied to the inner HTML (trusted source).
     * Metadata is added to both the inner rendering and the outer layout.
     */
    public String renderTemplate(@NonNull EmailTemplateTranslation emailTemplateTranslation, @NonNull Object content) {
        try {
            Map<String, Object> dataModel = createDataModel(content);
            addMetaData(emailTemplateTranslation.getLanguage(), dataModel);

            String templateName = emailTemplateTranslation.getEmailTemplate().getTemplateName() != null
                ? emailTemplateTranslation.getEmailTemplate().getTemplateName()
                : "inline";
            Template inlineTemplate = new Template(
                templateName,
                new StringReader(emailTemplateTranslation.getBodyHtml()),
                freemarkerConfig
            );

            String htmlBody = render(inlineTemplate, dataModel);

            return renderLayout(emailTemplateTranslation.getLanguage(), htmlBody,false);
        } catch (IOException ex) {
            throw new TemplateProcessingException(
                "Failed to process inline FreeMarker template: " +
                        emailTemplateTranslation.getEmailTemplate().getTemplateName() +
                    " for language: " +
                        emailTemplateTranslation.getLanguage(),
                ex
            );
        }
    }

    /**
     * Wraps raw HTML into the styled email layout.
     * This variant sanitizes by default (useful for untrusted HTML).
     * Metadata is always added.
     */
    public String renderRawTemplate(@NonNull Language language, String html) {
        return renderLayout(language, html, /*sanitize*/ true);
    }

    /**
     * Centralized layout rendering to ensure consistent behavior.
     */
    private String renderLayout(@NonNull Language language, String html, boolean sanitize) {
        try {
            Template layout = freemarkerConfig.getTemplate(BASE_RAW_TEMPLATE);

            Map<String, Object> model = new HashMap<>();
            model.put("bodyHtml", sanitize ? HtmlSanitizer.sanitize(html) : html);

            // Always add metadata to the outer layout as well.
            addMetaData(language, model);

            return render(layout, model);
        } catch (IOException ex) {
            throw new TemplateProcessingException("Failed to load raw FreeMarker template", ex);
        }
    }

    /**
     * Processes a FreeMarker template with the given data model.
     */
    private String render(Template template, Map<String, Object> dataModel) {
        try (StringWriter writer = new StringWriter()) {
            template.process(dataModel, writer);
            return writer.toString();
        } catch (IOException | TemplateException ex) {
            throw new TemplateProcessingException(
                "Failed to render FreeMarker template '" + template.getName() + "'", ex
            );
        }
    }

    private Map<String, Object> createDataModel(Object content) {
        Map<String, Object> dataModel = new HashMap<>();
        switch (content) {
            case Application application -> addApplicationData(dataModel, application);
            case Job job -> addJobData(dataModel, job);
            case ResearchGroup researchGroup -> addResearchGroupData(dataModel, researchGroup);
            case null, default -> {
                assert content != null;
                throw new TemplateProcessingException("Unsupported content type: " + content.getClass().getName());
            }
        }
        return dataModel;
    }

    private void addApplicationData(Map<String, Object> dataModel, Application application) {
        User applicant = application.getApplicant().getUser();
        dataModel.put(TemplateVariable.APPLICANT_FIRST_NAME.getValue(), applicant.getFirstName());
        dataModel.put(TemplateVariable.APPLICANT_LAST_NAME.getValue(), applicant.getLastName());

        addJobData(dataModel, application.getJob());
    }

    private void addJobData(Map<String, Object> dataModel, Job job) {
        dataModel.put(TemplateVariable.JOB_TITLE.getValue(), job.getTitle());

        User supervisingProfessor = job.getSupervisingProfessor();
        dataModel.put(TemplateVariable.SUPERVISING_PROFESSOR_FIRST_NAME.getValue(), supervisingProfessor.getFirstName());
        dataModel.put(TemplateVariable.SUPERVISING_PROFESSOR_LAST_NAME.getValue(), supervisingProfessor.getLastName());

        addResearchGroupData(dataModel, job.getResearchGroup());
    }

    private void addResearchGroupData(Map<String, Object> dataModel, ResearchGroup researchGroup) {
        dataModel.put(TemplateVariable.RESEARCH_GROUP_NAME.getValue(), researchGroup.getName());
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
}
