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
import org.springframework.stereotype.Service;

@Service
public class TemplateService {

    private final Configuration freemarkerConfig;

    public TemplateService(Configuration freemarkerConfig) {
        this.freemarkerConfig = freemarkerConfig;
    }

    public String renderSubject(@NonNull String templateName, @NonNull Language language, @NonNull Map<String, Object> content) {
        String templatePath = language.getCode() + "/" + templateName + "_subject.ftl";
        try (StringWriter writer = new StringWriter()) {
            Template template = freemarkerConfig.getTemplate(templatePath);
            template.process(content, writer);
            return "TUMApply – " + writer.toString().trim();
        } catch (IOException e) {
            // Subject template not found
            return "TUMApply";
        } catch (TemplateException e) {
            throw new TemplateProcessingException("Failed to render subject template: " + templateName, e);
        }
    }

    /**
     * Renders the specified template for a given language.
     */
    public String renderTemplate(@NonNull String templateName, @NonNull Language language, @NonNull Map<String, Object> content) {
        Map<String, Object> dataModel = new HashMap<>(content);
        try {
            Template template = freemarkerConfig.getTemplate(language.getCode() + "/" + templateName + ".ftl");

            addLanguage(language, dataModel);
            return render(template, dataModel);
        } catch (IOException ex) {
            throw new TemplateProcessingException(
                "Failed to load FreeMarker template: " + templateName + " for language: " + language.getCode(),
                ex
            );
        }
    }

    /**
     * Renders raw HTML into the styled email layout for the given language using the "raw" template.
     */
    public String renderRawTemplate(@NonNull Language language, String html) {
        try {
            Template template = freemarkerConfig.getTemplate("base/raw.ftl");

            Map<String, Object> dataModel = new HashMap<>();
            dataModel.put("bodyHtml", HtmlSanitizer.sanitize(html));

            addLanguage(language, dataModel);
            return render(template, dataModel);
        } catch (IOException ex) {
            throw new TemplateProcessingException("Failed to load raw FreeMarker template", ex);
        }
    }

    private String render(Template template, Map<String, Object> dataModel) {
        try (StringWriter writer = new StringWriter()) {
            template.process(dataModel, writer);
            return writer.toString();
        } catch (IOException | TemplateException ex) {
            throw new TemplateProcessingException("Failed to render FreeMarker template '" + template.getName() + "'", ex);
        }
    }

    private void addLanguage(Language language, Map<String, Object> dataModel) {
        dataModel.put("language", language.getCode());
    }
}
