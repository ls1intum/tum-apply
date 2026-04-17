package de.tum.cit.aet.ai.web;

import de.tum.cit.aet.ai.dto.ComplianceIssue;
import de.tum.cit.aet.ai.dto.ExtractedApplicationDataDTO;
import de.tum.cit.aet.ai.dto.TranslateComplianceDTO;
import de.tum.cit.aet.ai.service.AiService;
import de.tum.cit.aet.core.security.annotations.ApplicantOrAdmin;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployeeOrAdmin;
import de.tum.cit.aet.job.dto.JobFormDTO;
import java.util.List;
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
     * Stream-translate a job description text using SSE.
     * Returns Server-Sent Events that emit content chunks as they are generated.
     *
     * @param toLang  the target language for translation ("de" or "en")
     * @param request A DTO containing the text to translate
     * @return a Flux of content chunks streamed as Server-Sent Events
     */
    @ProfessorOrEmployeeOrAdmin
    @PutMapping(value = "translateJobDescriptionStream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> translateJobDescriptionStream(@RequestParam("toLang") String toLang, @RequestBody TranslateComplianceDTO request) {
        log.info("PUT /api/ai/translateJobDescriptionStream - Streaming translation request received (toLang={})", toLang);
        return aiService.translateTextStream(request.text(), toLang);
    }

    /**
     * Extracts applicant data from PDF files using AI and persists the extracted
     * values into the application entity.
     *
     * @param applicationId the ID of the application to update
     * @param docIds        the IDs of the document dictionary entries for the PDFs
     * @return a ResponseEntity containing the extracted data
     */
    @ApplicantOrAdmin
    @PutMapping(value = "extractPdfData", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ExtractedApplicationDataDTO> extractPdfData(
        @RequestParam("applicationId") String applicationId,
        @RequestParam("docIds") List<String> docIds,
        @RequestParam(value = "isCv", defaultValue = "true") boolean isCv,
        @RequestParam(value = "saveData", defaultValue = "false") boolean saveData
    ) {
        log.info(
            "PUT /api/ai/extractPdfData - PDF extraction request received (applicationId={}, docIds={}, isCV={}, saveData={}",
            applicationId,
            docIds,
            isCv,
            saveData
        );
        return ResponseEntity.ok(aiService.extractAndPersistPdfData(applicationId, docIds, isCv, saveData));
    }

    /**
     * Extracts applicant data from uploaded PDF files using AI without requiring
     * persisted document IDs. Files are processed in-memory only.
     *
     * @param applicationId the ID of the application to update (if saveData is true)
     * @param files         the PDF files to extract data from
     * @param isCv          whether the documents are CVs or certificates
     * @param saveData      whether to persist the extracted data into the application
     * @return a ResponseEntity containing the extracted data
     */
    @ApplicantOrAdmin
    @PostMapping(
        value = "extractPdfDataFromFiles",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ExtractedApplicationDataDTO> extractPdfDataFromFiles(
        @RequestParam(value = "applicationId", required = false) String applicationId,
        @RequestPart("files") List<MultipartFile> files,
        @RequestParam(value = "isCv", defaultValue = "true") boolean isCv,
        @RequestParam(value = "saveData", defaultValue = "false") boolean saveData
    ) {
        log.info(
            "POST /api/ai/extractPdfDataFromFiles - File upload extraction request received (applicationId={}, fileCount={}, isCV={}, saveData={})",
            applicationId,
            files.size(),
            isCv,
            saveData
        );
        return ResponseEntity.ok(aiService.extractPdfDataFromFiles(applicationId, files, isCv, saveData));
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
    public ResponseEntity<List<ComplianceIssue>> analyzeJobDescriptionForCompliance(
        @RequestBody JobFormDTO jobForm,
        @RequestParam("lang") String descriptionLanguage
    ) {
        log.info("POST /api/ai/analyzeJobDescription - Request received (toLang={})", descriptionLanguage);
        return ResponseEntity.ok(aiService.analyzeCurrentJobDescription(jobForm, descriptionLanguage));
    }
}
