package de.tum.cit.aet.ai.service;

import static de.tum.cit.aet.core.constants.GenderBiasWordLists.*;

import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.dto.ExtractedApplicationDataDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.exception.PDFExtractionException;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
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

    public AiService(
        ChatClient.Builder chatClientBuilder,
        JobService jobService,
        ApplicationService applicationService,
        DocumentDictionaryService documentDictionaryService
    ) {
        this.chatClient = chatClientBuilder.build();
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.documentDictionaryService = documentDictionaryService;
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
        AIJobDescriptionTranslationDTO translated = translateText(text, toLang);
        String translatedText = translated.translatedText();
        if (translatedText != null && !translatedText.isBlank()) {
            jobService.updateJobDescriptionLanguage(jobId, toLang, translatedText);
        }
        return translated;
    }

    /**
     * Extracts applicant data from the provided PDF file
     *
     * @param pdfFile the uploaded multipart PDF file to be analyzed
     * @return the parsed data from the document
     * @throws PDFExtractionException if an I/O error occurs while reading the PDF file
     */
    private ExtractedApplicationDataDTO extractPdfData(Resource pdfFile) {
        try (PDDocument document = Loader.loadPDF(pdfFile.getFile())) {
            PDFRenderer pdfRenderer = new PDFRenderer(document);

            // Render the first page (index 0) at 300 DPI for high OCR accuracy
            BufferedImage bim = pdfRenderer.renderImageWithDPI(0, 300);

            // Convert BufferedImage to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(bim, "jpg", baos);
            byte[] imageBytes = baos.toByteArray();

            return chatClient
                .prompt()
                .user(u ->
                    u
                        .text(pdfExtractionResource)
                        // Switch from APPLICATION_PDF to IMAGE_JPEG for Gemma 3
                        .media(MediaType.IMAGE_JPEG, new ByteArrayResource(imageBytes))
                )
                .call()
                .entity(ExtractedApplicationDataDTO.class);
        } catch (IOException e) {
            log.error("Failed to convert PDF to image for Gemma extraction", e);
            throw new RuntimeException("PDF conversion failed", e);
        }
    }

    /**
     * Extracts applicant data from a PDF document and persists the extracted data
     * in the application entity
     *
     * @return the extracted data as a structured DTO
     */
    public ExtractedApplicationDataDTO extractAndPersistPdfData(String applicationId, String docId) {
        Resource doc = documentDictionaryService.downloadDocument(UUID.fromString(docId));
        ExtractedApplicationDataDTO extracted = extractPdfData(doc);
        if (extracted != null) {
            applicationService.applyExtractedPdfData(applicationId, extracted);
        }
        return extracted;
    }
}
