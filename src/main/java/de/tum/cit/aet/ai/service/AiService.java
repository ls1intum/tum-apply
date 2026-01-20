package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.dto.AIJobDescriptionDTO;
import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AiService {

    @Value("classpath:prompts/JobDescriptionGeneration.st")
    private Resource jobGenerationResource;

    @Value("classpath:prompts/TranslateText.st")
    private Resource translationResource;

    private final ChatClient chatClient;

    private final JobService jobService;

    public AiService(ChatClient.Builder chatClientBuilder, JobService jobService) {
        this.chatClient = chatClientBuilder.build();
        this.jobService = jobService;
    }

    /**
     * Generates a polished job application draft from the provided job form data.
     * The draft is generated using the configured ChatClient with AGG\-compliant,
     * gender\-inclusive language.
     *
     * @param jobFormDTO          the job form data containing description, requirements, and tasks
     * @param descriptionLanguage the language for the generated job description
     * @return The generated job posting content
     */
    public AIJobDescriptionDTO generateJobApplicationDraft(JobFormDTO jobFormDTO, String descriptionLanguage) {
        String input = "de".equals(descriptionLanguage) ? jobFormDTO.jobDescriptionDE() : jobFormDTO.jobDescriptionEN();

        return chatClient
            .prompt()
            .user(u -> u.text(jobGenerationResource).param("jobDescription", input))
            .call()
            .entity(AIJobDescriptionDTO.class);
    }

    /**
     * Translates the provided text between German and English.
     * Automatically detects the source language and translates to the other language.
     * The translation preserves the original text structure and formatting.
     *
     * @param text the text to translate (German or English)
     * @return The translated text response with detected and target language info
     */
    private AIJobDescriptionTranslationDTO translateText(String text, String toLang) {
        return chatClient
            .prompt()
            .user(u -> u.text(translationResource).param("text", text).param("targetLanguage", toLang))
            .call()
            .entity(AIJobDescriptionTranslationDTO.class);
    }

    /**
     * Translates the provided job description text and persists the translated version
     * in the job entity for the specified language.
     *
     * @param jobId  the ID of the job to update
     * @param toLang the target language for translation ("de" or "en")
     * @param text   the job description text to translate
     * @return The translated text response with detected and target language info
     */
    public AIJobDescriptionTranslationDTO translateAndPersistJobDescription(String jobId, String toLang, String text) {
        AIJobDescriptionTranslationDTO translated = translateText(text, toLang);
        String translatedText = translated.translatedText();
        if (translatedText != null && !translatedText.isBlank()) {
            jobService.updateJobDescriptionLanguage(jobId, toLang, translatedText);
        }
        return translated;
    }
}
