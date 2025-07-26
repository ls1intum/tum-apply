package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.constants.TemplateVariable;
import de.tum.cit.aet.core.domain.EmailTemplate;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.core.repository.EmailTemplateRepository;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import freemarker.cache.StringTemplateLoader;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateExceptionHandler;
import java.io.IOException;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailTemplateRenderService {

    private final Configuration freemarkerConfig;

    @Value("${aet.client.url}")
    private String url;

    public EmailTemplateRenderService(Configuration freemarkerConfig, EmailTemplateRepository emailTemplateRepository) {
        this.freemarkerConfig = freemarkerConfig;
    }

    public String renderSubject(EmailTemplate emailTemplate) {
        return "TUMApply - " + emailTemplate.getSubject();
    }

    public String renderTemplate(@NonNull EmailTemplate emailTemplate, @NonNull Object content) {
        try {
            StringTemplateLoader stringLoader = new StringTemplateLoader();
            String templateName = "dynamicTemplate"; // unique key for the template
            stringLoader.putTemplate(templateName, emailTemplate.getBodyHtml());

            Configuration stringBasedConfig = new Configuration(Configuration.VERSION_2_3_32);
            stringBasedConfig.setDefaultEncoding("UTF-8");
            stringBasedConfig.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
            stringBasedConfig.setTemplateLoader(stringLoader);

            Template template = stringBasedConfig.getTemplate(templateName);

            Map<String, Object> dataModel = createDataModel(content);
            String htmlBody = render(template, dataModel);

            return renderRawTemplate(emailTemplate.getLanguage(), htmlBody);
        } catch (IOException ex) {
            throw new TemplateProcessingException(
                "Failed to process inline FreeMarker template: " +
                emailTemplate.getTemplateName() +
                " for language: " +
                emailTemplate.getLanguage(),
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

    private Map<String, Object> createDataModel(Object content) {
        Map<String, Object> dataModel = new HashMap<>();
        switch (content) {
            case Application application -> addApplicationData(dataModel, application);
            case Job job -> addJobData(dataModel, job);
            case ResearchGroup researchGroup -> addResearchGroupData(dataModel, researchGroup);
            case null, default -> {
                assert content != null;
                throw new IllegalStateException("Unsupported content type: " + content.getClass().getName());
            }
        }
        return dataModel;
    }

    private void addApplicationData(Map<String, Object> dataModel, Application application) {
        User applicant = application.getApplicant();
        dataModel.put(TemplateVariable.APPLICANT_FIRST_NAME.getValue(), applicant.getFirstName());
        dataModel.put(TemplateVariable.APPLICANT_LAST_NAME.getValue(), applicant.getLastName());

        addJobData(dataModel, application.getJob());
    }

    private void addJobData(Map<String, Object> dataModel, Job job) {
        dataModel.put(TemplateVariable.JOB_TITLE.getValue(), job.getTitle());

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
