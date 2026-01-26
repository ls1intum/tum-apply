package de.tum.cit.aet.ai.service;

import static de.tum.cit.aet.core.constants.GenderBiasWordLists.*;

import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.core.dto.UiTextFormatter;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import java.time.Duration;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.azure.openai.AzureOpenAiChatOptions;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@Slf4j
public class AiService {

    @Value("classpath:prompts/JobDescriptionGeneration.st")
    private Resource jobGenerationResource;

    @Value("classpath:prompts/TranslateText.st")
    private Resource translationResource;

    private final ChatClient chatClient;

    private final JobService jobService;

    /**
     * Maximum number of tokens for AI completion responses.
     * Set to 2000 to balance response length with generation speed.
     */
    private static final int MAX_COMPLETION_TOKENS = 2000;

    /**
     * Chat options for fast, deterministic responses.
     */
    private static final AzureOpenAiChatOptions FAST_CHAT_OPTIONS = AzureOpenAiChatOptions.builder()
        .maxCompletionTokens(MAX_COMPLETION_TOKENS)
        .reasoningEffort("low")
        .build();

    public AiService(ChatClient.Builder chatClientBuilder, JobService jobService) {
        this.chatClient = chatClientBuilder.build();
        this.jobService = jobService;
    }

    /**
     * Generates a job application draft using streaming for faster perceived response time.
     * Returns a Flux that emits content chunks as they are generated.
     * After streaming completes, automatically translates the content to the other language.
     *
     * @param jobFormDTO          the job form data containing description, requirements, and tasks
     * @param descriptionLanguage the language for the generated job description ("de" or "en")
     * @param jobId               optional job ID - if provided, auto-translates to the other language after streaming
     * @return Flux of content chunks as they are generated
     */
    public Flux<String> generateJobApplicationDraftStream(JobFormDTO jobFormDTO, String descriptionLanguage, String jobId) {
        String input = "de".equals(descriptionLanguage) ? jobFormDTO.jobDescriptionDE() : jobFormDTO.jobDescriptionEN();

        Set<String> inclusive = "de".equals(descriptionLanguage) ? GERMAN_INCLUSIVE : ENGLISH_INCLUSIVE;
        Set<String> nonInclusive = "de".equals(descriptionLanguage) ? GERMAN_NON_INCLUSIVE : ENGLISH_NON_INCLUSIVE;
        final String locationText = UiTextFormatter.formatEnumValue(jobFormDTO.location());
        Flux<String> contentFlux = chatClient
            .prompt()
            .options(FAST_CHAT_OPTIONS)
            .user(u ->
                u
                    .text(jobGenerationResource)
                    .param("jobDescription", input)
                    .param("title", jobFormDTO.title() != null ? jobFormDTO.title() : "")
                    .param("researchArea", jobFormDTO.researchArea() != null ? jobFormDTO.researchArea() : "")
                    .param("fieldOfStudies", jobFormDTO.fieldOfStudies() != null ? jobFormDTO.fieldOfStudies() : "")
                    .param("location", locationText)
                    .param("inclusiveWords", String.join(", ", inclusive))
                    .param("nonInclusiveWords", String.join(", ", nonInclusive))
            )
            .stream()
            .content();

        if (jobId != null) {
            StringBuilder contentBuilder = new StringBuilder();
            String targetLang = "de".equals(descriptionLanguage) ? "en" : "de";

            return contentFlux
                .doOnNext(contentBuilder::append)
                .doOnComplete(() -> {
                    String fullContent = contentBuilder.toString();
                    if (!fullContent.isBlank()) {
                        translateAndPersistJobDescription(jobId, targetLang, fullContent);
                    }
                });
        }

        return contentFlux;
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
            .options(FAST_CHAT_OPTIONS)
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
