package de.tum.cit.aet.ai.web;

import de.tum.cit.aet.ai.dto.AIJobDescriptionDTO;
import de.tum.cit.aet.ai.dto.AIJobDescriptionTranslationDTO;
import de.tum.cit.aet.ai.service.AiService;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployeeOrAdmin;
import de.tum.cit.aet.job.dto.JobFormDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
     * Generate a job application draft from the provided structured job form.
     *
     * @param descriptionLanguage the language for the generated job description
     * @param jobForm             the job form data used to build the AI prompt
     * @return a ResponseEntity containing the generated draft as JSON string
     */
    @ProfessorOrEmployeeOrAdmin
    @PutMapping(value = "generateJobDescription", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AIJobDescriptionDTO> generateJobApplicationDraft(
        @RequestBody JobFormDTO jobForm,
        @RequestParam("lang") String descriptionLanguage
    ) {
        log.info("PUT /api/ai/generateJobDescription - Request received (lang={})", descriptionLanguage);
        return ResponseEntity.ok(aiService.generateJobApplicationDraft(jobForm, descriptionLanguage));
    }

    /**
     * Translate text between German and English.
     * Automatically detects the source language and translates to the other language.
     * Preserves the original text structure and formatting.
     *
     * @param jobId the ID of the job for which the description is being translated
     * @param toLang the target language for translation ("de" or "en")
     * @param text the text to translate (German or English)
     * @return a ResponseEntity containing the translated text with language info
     */
    @ProfessorOrEmployeeOrAdmin
    @PutMapping(value = "translateJobDescriptionForJob", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AIJobDescriptionTranslationDTO> translateJobDescriptionForJob(
        @RequestParam("jobId") String jobId,
        @RequestParam("toLang") String toLang,
        @RequestBody String text
    ) {
        log.info("PUT /api/ai/translateJobDescriptionForJob - Request received (jobId={}, toLang={})", jobId, toLang);
        return ResponseEntity.ok(aiService.translateAndPersistJobDescription(jobId, toLang, text));
    }
}
