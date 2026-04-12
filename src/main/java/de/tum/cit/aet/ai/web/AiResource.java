package de.tum.cit.aet.ai.web;

import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.dto.ComplianceResponseDTO;
import de.tum.cit.aet.ai.dto.ExtractedApplicationDataDTO;
import de.tum.cit.aet.ai.dto.TranslateComplianceDTO;
import de.tum.cit.aet.ai.service.AiService;
import de.tum.cit.aet.core.security.annotations.ApplicantOrAdmin;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployeeOrAdmin;
import de.tum.cit.aet.job.dto.JobFormDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

/**
 * REST controller for AI-related endpoints.
 * Provides endpoints for AI-powered features such as job description generation and translation.
 */
@RestController
@RequestMapping("api/ai/")
@Slf4j
@Profile("!openapi")
public class AiResource {

    private final AiService aiService;

    public AiResource(AiService aiService) {
        this.aiService = aiService;
    }

    /**
     * Generate a job application draft using streaming for faster perceived response time.
     * Returns Server-Sent Events (SSE) that emit content chunks as they are generated.
     * Optionally translates the generated content to the other language after streaming if jobId is provided.
     *
     * @param descriptionLanguage the language for the generated job description ("de" or "en")
     * @param jobForm             the job form data used to build the AI prompt
     * @return a Flux of content chunks streamed as Server-Sent Events
     */
    @ProfessorOrEmployeeOrAdmin
    @PutMapping(value = "generateJobApplicationDraftStream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> generateJobApplicationDraftStream(
        @RequestBody JobFormDTO jobForm,
        @RequestParam("lang") String descriptionLanguage
    ) {
        log.info("PUT /api/ai/generateJobApplicationDraftStream - Streaming request received (lang={})", descriptionLanguage);
        return aiService.generateJobApplicationDraftStream(jobForm, descriptionLanguage);
    }

    /**
     * Translate text between German and English.
     * Automatically detects the source language and translates to the other language.
     * Preserves the original text structure and formatting.
     * Triggers a secondary gender-bias analysis for the translated version to ensure
     * that the inclusivity score remains consistent and valid in both language contexts.
     *
     * @param jobId  the ID of the job for which the description is being translated
     * @param toLang the target language for translation ("de" or "en")
     * @param request A DTO containing the text to translate, original analysis, and job context.
     * @return a ResponseEntity containing the translated text with language info
     */
    @ProfessorOrEmployeeOrAdmin
    @PutMapping(value = "translateJobDescriptionForJob", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AIJobDescriptionTranslationDTO> translateJobDescriptionForJob(
        @RequestParam("jobId") String jobId,
        @RequestParam("toLang") String toLang,
        @RequestBody TranslateComplianceDTO request
    ) {
        log.info("PUT /api/ai/translateJobDescriptionForJob - Request received (jobId={}, toLang={})", jobId, toLang);
        return ResponseEntity.ok(
            aiService.translateAndPersistJobDescription(jobId, toLang, request.text(), request.originalAnalysis(), request.jobForm())
        );
    }

    /**
     * Extracts applicant data from a PDF file using AI and persists the extracted
     * values into the application entity.
     *
     * @param applicationId the ID of the application to update
     * @param docId         the ID of the document dictionary entry for the PDF
     * @return a ResponseEntity containing the extracted data
     */
    @ApplicantOrAdmin
    @PutMapping(value = "extractPdfData", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ExtractedApplicationDataDTO> extractPdfData(
        @RequestParam("applicationId") String applicationId,
        @RequestParam("docId") String docId
    ) {
        log.info("PUT /api/ai/extractPdfData - PDF extraction request received (applicationId={}, docId={}", applicationId, docId);
        return ResponseEntity.ok(aiService.extractAndPersistPdfData(applicationId, docId));
    }

    /**
     * Analyzes the job description in real time for compliance violations
     * and provides corresponding feedback.
     *
     * @param jobForm the job form data used as the basis for the analysis
     * @param descriptionLanguage the language of the job description, `de` or `en`
     * @return a ResponseEntity containing detected compliance findings
     */

    @ProfessorOrEmployeeOrAdmin
    @PostMapping(value = "analyze-job-description", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ComplianceResponseDTO> analyzeJobDescriptionForCompliance(
        @RequestBody JobFormDTO jobForm,
        @RequestParam("lang") String descriptionLanguage
    ) {
        log.info("POST /api/ai/analyzeJobDescription - Request received (toLang={})", descriptionLanguage);
        return ResponseEntity.ok(aiService.analyzeCurrentJobDescription(jobForm, descriptionLanguage));
    }
}
