package de.tum.cit.aet.ai.service;

import static de.tum.cit.aet.core.constants.GenderBiasWordLists.*;

import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.dto.ComplianceResponseDTO;
import de.tum.cit.aet.ai.dto.ExtractedApplicationDataDTO;
import de.tum.cit.aet.application.service.ApplicationService;
import de.tum.cit.aet.core.dto.BiasedWordDTO;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import de.tum.cit.aet.core.exception.InternalServerException;
import de.tum.cit.aet.core.exception.InvalidParameterException;
import de.tum.cit.aet.core.exception.PDFExtractionException;
import de.tum.cit.aet.core.service.DocumentDictionaryService;
import de.tum.cit.aet.core.service.GenderBiasAnalysisService;
import de.tum.cit.aet.job.constants.ComplianceCategory;
import de.tum.cit.aet.job.dto.JobFormDTO;
import de.tum.cit.aet.job.service.JobService;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.jsoup.Jsoup;
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

    @Value("classpath:prompts/AnalyzeComplianceText.st")
    private Resource complianceResource;

    private final ChatClient chatClient;

    private final JobService jobService;

    private final ApplicationService applicationService;

    private final DocumentDictionaryService documentDictionaryService;

    private final GenderBiasAnalysisService genderBiasAnalysisService;

    private static final double FACTOR_NEUTRAL = 1.0;
    private static final double FACTOR_NON_INCLUSIVE = 0.5;
    private static final double PENALTY_FACTOR = 0.85;

    public AiService(
        ChatClient.Builder chatClientBuilder,
        JobService jobService,
        ApplicationService applicationService,
        DocumentDictionaryService documentDictionaryService,
        GenderBiasAnalysisService genderBiasAnalysisService
    ) {
        this.chatClient = chatClientBuilder.build();
        this.jobService = jobService;
        this.applicationService = applicationService;
        this.documentDictionaryService = documentDictionaryService;
        this.genderBiasAnalysisService = genderBiasAnalysisService;
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
     * If persistence succeeds and a job form is available, the method triggers secondary
     * gender-bias analysis and updates the job-description compliance state with translated version.
     *
     * @param jobId  the ID of the job to update
     * @param toLang the target language for translation ("de" or "en")
     * @param text   the job description text to translate
     * @param originalAnalysis original gender analysis of the source text
     * @param jobFormDTO job form context required for compliance update
     * @return The translated text response with detected and target language info
     */
    public AIJobDescriptionTranslationDTO translateAndPersistJobDescription(
        String jobId,
        String toLang,
        String text,
        GenderBiasAnalysisResponse originalAnalysis,
        JobFormDTO jobFormDTO
    ) {
        UUID parsedJobId = parseJobId(jobId);
        if (parsedJobId == null) {
            throw new InvalidParameterException("The provided jobId is missing or not a valid UUID.");
        }

        AIJobDescriptionTranslationDTO translated = translateText(text, toLang);
        String translatedText = translated.translatedText();

        if (translatedText != null && !translatedText.isBlank()) {
            try {
                jobService.updateJobDescriptionLanguage(jobId, toLang, translatedText);

                if (jobFormDTO != null) {
                    String plainText = Jsoup.parse(text).text();
                    String plainTranslatedText = Jsoup.parse(translatedText).text();
                    GenderBiasAnalysisResponse sourceAnalysis = originalAnalysis;
                    if (sourceAnalysis == null && !plainText.isBlank()) {
                        String sourceLang = "de".equalsIgnoreCase(toLang) ? "en" : "de";
                        sourceAnalysis = genderBiasAnalysisService.analyzeText(plainText, sourceLang);
                    }
                    GenderBiasAnalysisResponse translatedAnalysis = genderBiasAnalysisService.analyzeText(plainTranslatedText, toLang);
                    analyzeJobDescription(jobFormDTO, parsedJobId, plainTranslatedText, toLang, sourceAnalysis, translatedAnalysis);
                }
            } catch (Exception e) {
                log.warn("Translation generated, but persistence/compliance update failed for jobId={}", jobId, e);
                throw new InternalServerException("Translation generated, but storage failed", e);
            }
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
     * @return A ComplianceResponseDTO containing the combined legal and linguistic findings.
     */
    public ComplianceResponseDTO analyzeCurrentJobDescription(JobFormDTO jobFormDTO, String lang) {
        String raw = "de".equals(lang) ? jobFormDTO.jobDescriptionDE() : jobFormDTO.jobDescriptionEN();
        String input = raw != null ? Jsoup.parse(raw).text() : "";
        GenderBiasAnalysisResponse genderAnalysis = genderBiasAnalysisService.analyzeText(input, lang);
        return analyzeJobDescription(jobFormDTO, jobFormDTO.jobId(), input, lang, genderAnalysis, null);
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
     * @param jobFormDTO the job form data containing language-specific job descriptions
     * @param jobId Unique identifier for the job.
     * @param text Extracted raw text of the job description.
     * @param lang the analysis language, expected to be `de` or `en`
     * @param analysis Result of the primary linguistic gender analysis.
     * @param translatedAnalysis Second analysis of the translated counterpart.
     * @return A structured ComplianceResponseDTO containing all identified issues.
     */

    public ComplianceResponseDTO analyzeJobDescription(
        JobFormDTO jobFormDTO,
        UUID jobId,
        String text,
        String lang,
        GenderBiasAnalysisResponse analysis,
        GenderBiasAnalysisResponse translatedAnalysis
    ) {
        ComplianceResponseDTO complianceResponse;
        try {
            complianceResponse = chatClient
                .prompt()
                .user(u ->
                    u
                        .text(complianceResource)
                        .param("descriptionLanguage", lang)
                        .param("jobDescription", text)
                        .param("title", jobFormDTO.title() != null ? jobFormDTO.title() : "")
                )
                .call()
                .entity(ComplianceResponseDTO.class);
        } catch (Exception e) {
            log.warn("Compliance response parsing failed for jobId={}, storing score without compliance details", jobId, e);
            complianceResponse = new ComplianceResponseDTO(Collections.emptyList());
        }

        int genderScore = calculateGenderScore(analysis, translatedAnalysis);

        int legalScore = calculateLegalScore(complianceResponse);
        // geometric means
        int combinedScore = (int) Math.round(Math.sqrt((double) genderScore * legalScore));

        jobService.updateAiAnalysis(jobId, combinedScore, complianceResponse);

        return complianceResponse;
    }

    /**
     * Calculates a legal compliance score based on a hierarchical risk model.
     * * The calculation follows the Gatekeeper-Principle for severe risks and Exponential Decay
     * for minor issues. If a CRITICAL_AGG violation is detected, the score is immediately 0
     * (Veto-Principle), as these represent non-negotiable legal liabilities.
     * * For transparency issues, the score is reduced multiplicatively using the formula
     * S(n) = 100 * 0.85^n. The decay factor of 0.85 is set to trigger a critical
     * threshold (~60%) after three cumulative issues, reflecting the diminishing
     * marginal quality of the job description. This approach mirrors risk assessment
     * standards like ISO 31000 and prevents negative scores common in linear models.
     *
     * @param compliance the structured analysis containing identified compliance issues
     * @return an integer score from 0 to 100 representing legal integrity
     */
    private int calculateLegalScore(ComplianceResponseDTO compliance) {
        if (compliance == null || compliance.issues() == null || compliance.issues().isEmpty()) {
            return 100;
        }

        long criticalCount = compliance
            .issues()
            .stream()
            .filter(i -> i.category() == ComplianceCategory.CRITICAL_AGG)
            .count();

        if (criticalCount > 0) {
            return 0;
        }

        long transparencyCount = compliance
            .issues()
            .stream()
            .filter(i -> i.category() == ComplianceCategory.TRANSPARENCY)
            .count();

        double score = 100.0 * Math.pow(PENALTY_FACTOR, transparencyCount);

        return (int) Math.max(0, Math.round(score));
    }

    /**
     * Calculates the combined gender bias score for a job description for consistency.
     * Analyzes both languages (DE and EN) and returns the average score.
     *
     * @param originalAnalysis The analysis results for the primary description language.
     * @param translatedAnalysis The analysis results for the secondary/translated language.
     * @return the combined gender bias score (0-100)
     */
    public int calculateCombinedScore(GenderBiasAnalysisResponse originalAnalysis, GenderBiasAnalysisResponse translatedAnalysis) {
        int scoreDE = calculateScore(originalAnalysis);
        int scoreEN = calculateScore(translatedAnalysis);

        return (int) Math.round((scoreDE + scoreEN) / 2.0);
    }

    /**
     * Determines the final gender score by evaluating available language analyses.
     * 1. If both language versions (original and translated) are available, the combined version is set.
     * 2. If only one version is present, it falls back to the single-language score calculation.
     * This approach ensures scoring stability and consistency across multilingual job descriptions after
     * translation, while preventing data gaps when a translation is still pending or partially available.
     *
     * @param originalAnalysis Analysis results for the primary description language.
     * @param translatedAnalysis Analysis results for the secondary/translated language.
     * @return A compiled integer score (0-100) based on the most comprehensive data available.
     */
    private int calculateGenderScore(GenderBiasAnalysisResponse originalAnalysis, GenderBiasAnalysisResponse translatedAnalysis) {
        if (originalAnalysis != null && translatedAnalysis != null) {
            return calculateCombinedScore(originalAnalysis, translatedAnalysis);
        }
        if (originalAnalysis != null) {
            return calculateScore(originalAnalysis);
        }
        if (translatedAnalysis != null) {
            return calculateScore(translatedAnalysis);
        }
        return 0;
    }

    /**
     * Calculates the compliance score of a job posting based on the gender bias analysis.
     * The calculation is performed in several steps:
     * 1. If no analysis is available (or coding is 'empty'), it returns 100 if there is text, or 0 if content is empty.
     * 2. Calculates the ratio (`inclusiveWeight`) of inclusive words to the total number of flagged words (inclusive + non-inclusive)
     * 3. Applies a penalty factor based on the overall coding of the analysis:
     * - 'neutral-coded': 1.0 (no penalty)
     * - 'inclusive-coded': 1.0 (no penalty))
     * - 'non-inclusive-coded': 0.5 (penalty)
     * 4. The final score is derived from the square root of (`inclusiveWeight` * factor) and scaled to a 0-100 range.
     * The square root is applied to soften the penalty curve and avoid overly harsh scores.
     *
     * @param analysis - The result of the gender bias analysis (including identified words and overall coding).
     * @returns An integer between 0 and 100 representing the inclusivity score.
     */
    private int calculateScore(GenderBiasAnalysisResponse analysis) {
        if (analysis == null) {
            return 100;
        }

        if ("empty".equals(analysis.coding())) {
            boolean hasWords = analysis.biasedWords() != null && !analysis.biasedWords().isEmpty();
            return hasWords ? 0 : 100;
        }
        List<BiasedWordDTO> biasedWords = analysis.biasedWords() != null ? analysis.biasedWords() : Collections.emptyList();

        long inclusiveCount = biasedWords
            .stream()
            .filter(word -> "inclusive".equals(word.type()))
            .count();

        long nonInclusiveCount = biasedWords
            .stream()
            .filter(word -> "non-inclusive".equals(word.type()))
            .count();

        if (nonInclusiveCount == 0) {
            return 100;
        }

        double totalCount = (double) inclusiveCount + (double) nonInclusiveCount;
        double inclusiveWeight = inclusiveCount / totalCount;

        double factor = getCodingFactor(analysis.coding());
        double score = Math.sqrt(inclusiveWeight * factor) * 100.0;

        return (int) Math.max(0, Math.min(100, Math.round(score)));
    }

    private double getCodingFactor(String coding) {
        return switch (coding) {
            case "neutral", "inclusive-coded" -> FACTOR_NEUTRAL;
            default -> FACTOR_NON_INCLUSIVE;
        };
    }

    private UUID parseJobId(String jobId) {
        if (jobId == null || jobId.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(jobId);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
