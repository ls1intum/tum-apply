package de.tum.cit.aet.ai.service;

import static de.tum.cit.aet.core.constants.GenderBiasWordLists.*;

import de.tum.cit.aet.ai.dto.ComplianceIssue;
import de.tum.cit.aet.ai.dto.ExtractedApplicationDataDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import de.tum.cit.aet.core.exception.InternalServerException;
import de.tum.cit.aet.core.exception.PDFExtractionException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.GenderBiasAnalysisService;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.*;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.jsoup.Jsoup;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
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

    @Value("classpath:prompts/AnalyzeComplianceText.st")
    private Resource complianceResource;

    private final ChatClient chatClient;

    private final JobService jobService;

    private final ApplicationService applicationService;

    private final DocumentDictionaryService documentDictionaryService;

    private final CurrentUserService currentUserService;

    private final GenderBiasAnalysisService genderBiasAnalysisService;

    private final ComplianceScoreService complianceScoreService;

    public AiService(
        ChatClient.Builder chatClientBuilder,
        JobService jobService,
        ApplicationService applicationService,
        DocumentDictionaryService documentDictionaryService,
        CurrentUserService currentUserService,
        GenderBiasAnalysisService genderBiasAnalysisService,
        ComplianceScoreService complianceScoreService
    ) {
        this.chatClient = chatClientBuilder.build();
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.documentDictionaryService = documentDictionaryService;
        this.currentUserService = currentUserService;
        this.genderBiasAnalysisService = genderBiasAnalysisService;
        this.complianceScoreService = complianceScoreService;
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
     * Streams the translation of a job description text using SSE.
     * Returns a Flux that emits content chunks as they are generated.
     *
     * @param text   the text to translate
     * @param toLang the target language ("de" or "en")
     * @return Flux of content chunks as they are generated
     */
    public Flux<String> translateTextStream(String text, String toLang) {
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
            .stream()
            .content()
            .delayElements(Duration.ofMillis(35));
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

    /**
     * This method serves as the entry point for localized analysis for the job description
     * in its currently selected language. It performs data sanitization by
     * extracting plain text from HTML content using JSoup to ensure the analysis algorithms
     * are not distorted by markup tags. Following sanitization, it triggers the primary gender bias analysis and
     * delegates the compliance check to the core analysis engine. This enforces DE/EN-specific feedback rules
     * before shared fallback logic, so immediate feedback always matches the active language.
     *
     * @param jobFormDTO The data transfer object containing the current state of the job posting.
     * @param lang The language identifier (de/en) currently active in the editor.
     * @param userLang controls the language of explanation texts in the returned issues.
     * @return A list of compliance issues containing the combined legal and linguistic findings.
     */
    public List<ComplianceIssue> analyzeCurrentJobDescription(JobFormDTO jobFormDTO, String lang, String userLang) {
        String raw = "de".equals(lang) ? jobFormDTO.jobDescriptionDE() : jobFormDTO.jobDescriptionEN();
        String input = raw != null ? Jsoup.parse(raw).text() : "";
        GenderBiasAnalysisResponse genderAnalysis = genderBiasAnalysisService.analyzeText(input, lang);
        return analyzeJobDescription(jobFormDTO.title(), jobFormDTO.jobId(), input, lang, userLang, genderAnalysis, null);
    }

    /**
     * Analyzes the job description using the compliance prompt
     * Passes the selected description language, the job description text,
     * and optionally the job title to the AI model.
     * Executes a hybrid compliance analysis using a dual-track processing model.
     * 1. Immediately calculates the gender bias scores using rule-based dictionary matching (GenderBiasAnalysisService).
     * 2. Asynchronous LLM-based audit for legal risks (AGG violations,transparency requirements) via CompletableFuture
     * to minimize latency. The results are merged using a geometric mean to ensure that a failure in one
     * dimension (e.g., severe legal risk) significantly impacts the total score.
     *
     * @param title the job form title
     * @param jobId Unique identifier for the job.
     * @param text Extracted raw text of the job description.
     * @param lang the analysis language, expected to be `de` or `en`
     * @param userLang controls the language of explanation texts in the returned issues.
     * @param analysis Result of the primary linguistic gender analysis.
     * @param translatedAnalysis Second analysis of the translated counterpart.
     * @return A list containing all identified compliance issues.
     */

    public List<ComplianceIssue> analyzeJobDescription(
        String title,
        UUID jobId,
        String text,
        String lang,
        String userLang,
        GenderBiasAnalysisResponse analysis,
        GenderBiasAnalysisResponse translatedAnalysis
    ) {
        List<ComplianceIssue> complianceIssues;
        try {
            complianceIssues = chatClient
                .prompt()
                .user(u ->
                    u
                        .text(complianceResource)
                        .param("descriptionLanguage", lang)
                        .param("userLang", userLang)
                        .param("jobDescription", text)
                        .param("title", title != null ? title : "")
                )
                .call()
                .entity(new ParameterizedTypeReference<>() {});
            complianceIssues.forEach(issue -> issue.setLanguage(lang));
        } catch (Exception e) {
            throw new InternalServerException("Compliance analysis parsing failed", e);
        }

        int genderScore = complianceScoreService.calculateGenderScore(analysis, translatedAnalysis);

        int legalScore = complianceScoreService.calculateLegalScore(complianceIssues);
        // geometric means
        int combinedScore = (int) Math.round(Math.sqrt((double) genderScore * legalScore));

        jobService.updateAiAnalysis(jobId, combinedScore, complianceIssues);

        return complianceIssues;
    }
}
