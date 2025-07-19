package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import java.io.IOException;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TemplateService {

    private final Configuration freemarkerConfig;

    @Value("${aet.client.url}")
    private String url;

    public TemplateService(Configuration freemarkerConfig) {
        this.freemarkerConfig = freemarkerConfig;
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
     * @param template   the FreeMarker template
     * @param dataModel  data model for template rendering
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
     * @param language    language enum
     * @param dataModel   model to which the language is added
     */
    private void addMetaData(Language language, Map<String, Object> dataModel) {
        dataModel.put("language", language.getCode());
        dataModel.put("url", url);
    }
}
