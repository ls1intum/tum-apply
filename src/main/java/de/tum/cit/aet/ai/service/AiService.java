package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.ai.dto.AIJobDescriptionDTO;
import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
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

    public AiService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
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
        var userSpec = chatClient
            .prompt()
            .user(u -> {
                u.text(jobGenerationResource);
                u.param("jobDescription", jobFormDTO.jobDescription());
                //optional metadata
                if (jobFormDTO.title() != null) {
                    u.param("title", jobFormDTO.title());
                }
                if (jobFormDTO.researchArea() != null) {
                    u.param("researchArea", jobFormDTO.researchArea());
                }
                if (jobFormDTO.fieldOfStudies() != null) {
                    u.param("fieldOfStudies", jobFormDTO.fieldOfStudies());
                }
                if (jobFormDTO.location() != null) {
                    u.param("location", jobFormDTO.location());
                }
            });

        return userSpec.call().entity(AIJobDescriptionDTO.class);
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
        return chatClient
            .prompt()
            .user(u -> u.text(translationResource).param("text", text))
            .call()
            .entity(AIJobDescriptionTranslationDTO.class);
    }
}
