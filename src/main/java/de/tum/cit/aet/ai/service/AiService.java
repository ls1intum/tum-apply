package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.dto.AIJobDescriptionDTO;
import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AiService {

    private static final String JOB_DESCRIPTION_PROMPT = "JobDescriptionGeneration";
    private static final String TRANSLATE_TEXT_PROMPT = "TranslateText";

    private final ChatClient chatClient;
    private final PromptLoader promptLoader;

    public AiService(ChatClient chatClient, PromptLoader promptLoader) {
        this.chatClient = chatClient;
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

    public AIJobDescriptionDTO generateJobApplicationDraft(JobFormDTO jobFormDTO) {
        var converter = new BeanOutputConverter<>(AIJobDescriptionDTO.class);

        return chatClient.prompt()
            .user(u -> u.text(promptLoader.getPrompt(JOB_DESCRIPTION_PROMPT))
                .param("jobDescription", jobFormDTO.jobDescription()))
            .call()
            .entity(converter);
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
        return chatClient.prompt()
            .user(u -> u.text(promptLoader.getPrompt(TRANSLATE_TEXT_PROMPT))
                .param("text", text))
            .call()
            .entity(AIJobDescriptionTranslationDTO.class);
    }
}
