package de.tum.cit.aet.ai.service;

import static de.tum.cit.aet.core.constants.GenderBiasWordLists.*;

import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.dto.ExtractedApplicationDataDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.exception.PDFExtractionException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
@Slf4j
public class AiService {

    @Value("classpath:prompts/JobDescriptionGeneration.st")
    private Resource jobGenerationResource;

    @Value("classpath:prompts/TranslateText.st")
    private Resource translationResource;

    @Value("classpath:prompts/ExtractPdfData.st")
    private Resource pdfExtractionResource;

    private final ChatClient chatClient;

    private final JobService jobService;

    private final ApplicationService applicationService;

    private final DocumentDictionaryService documentDictionaryService;

    private final CurrentUserService currentUserService;

    public AiService(
        ChatClient.Builder chatClientBuilder,
        JobService jobService,
        ApplicationService applicationService,
        DocumentDictionaryService documentDictionaryService,
        CurrentUserService currentUserService
    ) {
        this.chatClient = chatClientBuilder.build();
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.documentDictionaryService = documentDictionaryService;
        this.currentUserService = currentUserService;
    }


    /**
     * Generates a job application draft using streaming for faster perceived response time.
     * Returns a Flux that emits content chunks as they are generated.
     * After streaming completes, automatically translates the content to the other language.
     *
     * @param jobFormDTO          the job form data containing description, requirements, and tasks
     * @param descriptionLanguage the language for the generated job description ("de" or "en")
     * @return Flux of content chunks as they are generated
     */
    public Flux<String> generateJobApplicationDraftStream(JobFormDTO jobFormDTO, String descriptionLanguage) {
        String input = "de".equals(descriptionLanguage) ? jobFormDTO.jobDescriptionDE() : jobFormDTO.jobDescriptionEN();

        Set<String> inclusive = "de".equals(descriptionLanguage) ? GERMAN_INCLUSIVE : ENGLISH_INCLUSIVE;
        Set<String> nonInclusive = "de".equals(descriptionLanguage) ? GERMAN_NON_INCLUSIVE : ENGLISH_NON_INCLUSIVE;
        final String locationText = jobFormDTO.location() != null ? jobFormDTO.location().correctLanguageValue(descriptionLanguage) : "";

        return chatClient
            .prompt()
            .user(u ->
                u
                    .text(jobGenerationResource)
                    .param("descriptionLanguage", descriptionLanguage)
                    .param("jobDescription", input)
                    .param("title", jobFormDTO.title() != null ? jobFormDTO.title() : "")
                    .param("researchArea", jobFormDTO.researchArea() != null ? jobFormDTO.researchArea() : "")
                    .param(
                        "subjectArea",
                        jobFormDTO.subjectArea() != null ? jobFormDTO.subjectArea().correctLanguageValue(descriptionLanguage) : ""
                    )
                    .param("location", locationText)
                    .param("inclusiveWords", String.join(", ", inclusive))
                    .param("nonInclusiveWords", String.join(", ", nonInclusive))
            )
            .stream()
            .content()
            .delayElements(Duration.ofMillis(35));
    }

    /**
     * Translates the provided text between German and English.
     * The translation preserves the original text structure and formatting.
     *
     * @param text the text to translate (German or English)
     * @return The translated text response with detected and target language info
     */
    private AIJobDescriptionTranslationDTO translateText(String text, String toLang) {
        Set<String> inclusive = "de".equals(toLang) ? GERMAN_INCLUSIVE : ENGLISH_INCLUSIVE;
        Set<String> nonInclusive = "de".equals(toLang) ? GERMAN_NON_INCLUSIVE : ENGLISH_NON_INCLUSIVE;

        return chatClient
            .prompt()
            .user(u ->
                u
                    .text(translationResource)
                    .param("text", text)
                    .param("targetLanguage", toLang)
                    .param("inclusiveWords", String.join(", ", inclusive))
                    .param("nonInclusiveWords", String.join(", ", nonInclusive))
            )
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
        currentUserService.markAiConsentForCurrentUser();
        AIJobDescriptionTranslationDTO translated = translateText(text, toLang);
        String translatedText = translated.translatedText();
        if (translatedText != null && !translatedText.isBlank()) {
            jobService.updateJobDescriptionLanguage(jobId, toLang, translatedText);
        }
        return translated;
    }

    /**
     * Extracts applicant data from the provided PDF file by converting it to images
     * first, since the Azure OpenAI endpoint only accepts image inputs.
     * 1) Load the PDF and render each page as a PNG image
     * 2) Send the images to the LLM with the extraction prompt
     *
     * @param pdfFile the PDF file resource to be analyzed
     * @return the extracted data as a structured DTO
     */
    private ExtractedApplicationDataDTO extractPdfData(Resource pdfFile) {
        try (PDDocument document = Loader.loadPDF(pdfFile.getContentAsByteArray())) {
            // 1) Render each PDF page as a PNG image
            PDFRenderer pdfRenderer = new PDFRenderer(document);
            int pageCount = document.getNumberOfPages();

            List<ByteArrayResource> pageImages = new ArrayList<>(pageCount);
            for (int i = 0; i < pageCount; i++) {
                BufferedImage image = pdfRenderer.renderImageWithDPI(i, 300);
                ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                ImageIO.write(image, "png", byteArrayOutputStream);
                pageImages.add(new ByteArrayResource(byteArrayOutputStream.toByteArray()));
            }

            // 2) Send the images to the LLM with the extraction prompt
            return chatClient
                .prompt()
                .user(u -> {
                    u.text(pdfExtractionResource);
                    for (ByteArrayResource pageImage : pageImages) {
                        u.media(MediaType.IMAGE_PNG, pageImage);
                    }
                })
                .call()
                .entity(ExtractedApplicationDataDTO.class);
        } catch (IOException e) {
            throw new PDFExtractionException("PDF conversion failed", e);
        }
    }

    /**
     * Extracts applicant data from a PDF document and persists the extracted data
     * in the application entity.
     * 1) Download the document
     * 2) Extract data from the PDF via AI
     * 3) Persist the extracted data into the application
     *
     * @param applicationId the ID of the application to update with extracted data
     * @param docId         the ID of the document to extract data from
     * @return the extracted data as a structured DTO
     */
    public ExtractedApplicationDataDTO extractAndPersistPdfData(String applicationId, String docId) {
        currentUserService.markAiConsentForCurrentUser();
        // 1) Download the document
        Resource doc = documentDictionaryService.downloadDocument(UUID.fromString(docId));
        // 2) Extract data from the PDF via AI
        ExtractedApplicationDataDTO extracted = extractPdfData(doc);
        // 3) Persist the extracted data into the application
        if (extracted != null) {
            applicationService.applyExtractedPdfData(applicationId, extracted);
        }
        return extracted;
    }
}
