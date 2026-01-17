package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.exception.AiPromptException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Utility component for loading and caching prompt templates from classpath resources.
 * This is a more scalable approach than using multiple @Value annotations for each prompt.
 */
@Component
public class PromptLoader {

    private static final String PROMPTS_PATH = "prompts/";
    private final Map<String, String> promptCache = new ConcurrentHashMap<>();

    /**
     * Loads a prompt template from the classpath.
     * Results are cached for subsequent requests.
     *
     * @param promptName the name of the prompt file (without .txt extension)
     * @return the prompt template content
     * @throws AiPromptException if the prompt file cannot be read
     */
    public String getPrompt(String promptName) {
        return promptCache.computeIfAbsent(promptName, this::loadPrompt);
    }

    private String loadPrompt(String promptName) {
        String resourcePath = PROMPTS_PATH + promptName + ".txt";
        try (InputStream inputStream = new ClassPathResource(resourcePath).getInputStream()) {
            return StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new AiPromptException(e);
        }
    }
}
