package de.tum.cit.aet.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.ai.dto.AIJobDescriptionDTO;
import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.exception.AiResponseException;
import de.tum.cit.aet.job.dto.JobFormDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

@Service
@Slf4j
public class AiService {

    private static final String JOB_DESCRIPTION_PROMPT = "JobDescriptionGeneration";
    private static final String TRANSLATE_TEXT_PROMPT = "TranslateText";

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final PromptLoader promptLoader;

    public AiService(ChatClient chatClient, ObjectMapper objectMapper, PromptLoader promptLoader) {
        this.chatClient = chatClient;
        this.objectMapper = objectMapper;
        this.promptLoader = promptLoader;
    }

    /**
     * Generates a polished job application draft from the provided job form data.
     * The draft is generated using the configured ChatClient with AGG\-compliant,
     * gender\-inclusive language.
     *
     * @param jobFormDTO the job form data containing description, requirements, and tasks
     * @return The generated job posting content
     */

    public AIJobDescriptionDTO generateJobApplicationDraft(@RequestBody JobFormDTO jobFormDTO) {
        String promptTemplate = promptLoader.getPrompt(JOB_DESCRIPTION_PROMPT);
        String prompt = promptTemplate.formatted(jobFormDTO.jobDescription());
        String raw = chatClient.prompt().user(prompt).call().content();
        String cleanedJSON = cleanupJSON(raw);
        try {
            return objectMapper.readValue(cleanedJSON, AIJobDescriptionDTO.class);
        } catch (JsonProcessingException e) {
            throw new AiResponseException(e);
        }
    }

    /**
     * Translates the provided text between German and English.
     * Automatically detects the source language and translates to the other language.
     * The translation preserves the original text structure and formatting.
     *
     * @param text the text to translate (German or English)
     * @return The translated text response with detected and target language info
     */
    public AIJobDescriptionTranslationDTO translateText(String text) {
        String promptTemplate = promptLoader.getPrompt(TRANSLATE_TEXT_PROMPT);
        String prompt = promptTemplate.formatted(text);
        String raw = chatClient.prompt().user(prompt).call().content();
        String cleanedJSON = cleanupJSON(raw);
        try {
            return objectMapper.readValue(cleanedJSON, AIJobDescriptionTranslationDTO.class);
        } catch (JsonProcessingException e) {
            throw new AiResponseException(e);
        }
    }

    /**
     * Sanitizes raw AI output and extracts the substring between the first '{' and the last '}'
     *
     * @param aiResponse the raw response from the ChatClient
     * @return cleaned JSON string or "{}" if input is null or empty
     */

    private String cleanupJSON(String aiResponse) {
        if (aiResponse == null) return "{}";
        // removes markdown code fences
        String result = aiResponse.replace("```json", "").replace("```", "").trim();

        result = result.replace(", }", "}").replace(",}", "}").replace(", ]", "]").replace(",]", "]");

        int start = result.indexOf('{');
        int end = result.lastIndexOf('}');

        if (start >= 0 && end > start) {
            result = result.substring(start, end + 1);
        }
        return result;
    }
}
