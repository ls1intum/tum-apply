package de.tum.cit.aet.notification.service;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.exception.TemplateProcessingException;
import de.tum.cit.aet.notification.constants.EmailType;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Loads the default content for an email template from {@code src/main/resources/templates/{language}/}.
 * Files are cached lazily on first read; defaults never change at runtime.
 */
@Service
public class DefaultEmailTemplateProvider {

    public record DefaultContent(String subject, String bodyHtml) {}

    private final Map<String, DefaultContent> cache = new ConcurrentHashMap<>();

    /**
     * Loads default subject + body for the given email type and language.
     *
     * @param emailType the email type whose default content should be loaded
     * @param language  the language whose default content should be loaded
     * @return the cached or freshly loaded default subject and body
     * @throws TemplateProcessingException if a required default file is missing
     */
    public DefaultContent load(EmailType emailType, Language language) {
        String key = language.getCode() + "/" + emailType.name();
        return cache.computeIfAbsent(key, this::read);
    }

    private DefaultContent read(String key) {
        String subject = readResource("templates/" + key + "_subject.html");
        String bodyHtml = readResource("templates/" + key + ".html");
        return new DefaultContent(subject, bodyHtml);
    }

    private String readResource(String path) {
        try {
            return new String(Objects.requireNonNull(getClass().getClassLoader().getResourceAsStream(path)).readAllBytes());
        } catch (Exception e) {
            throw new TemplateProcessingException("Failed to read default template file: " + path, e);
        }
    }
}
