package de.tum.cit.aet.ai.web;

import de.tum.cit.aet.ai.service.AiService;
import de.tum.cit.aet.job.dto.JobFormDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Example REST controller for AI-related endpoints.
 * <p>
 * TODO: This file is only for test purposes and should be removed or replaced
 * with proper endpoints once the AI services are integrated into the main application flow.
 */
@RestController
@RequestMapping("api/ai/")
@Slf4j
@Profile("!openapi")
public class AiResource {

    private final AiService aiService;
    private final ChatClient chatClient;

    public AiResource(AiService aiService, ChatClient chatClient) {
        this.aiService = aiService;
        this.chatClient = chatClient;
    }

    /**
     * Example endpoint to generate a story based on the provided message. (Must be deleted or changed later)
     * Streams the response as a text event stream.
     *
     * @param message The input message to generate the story from.
     * @return The generated story content.

    GetMapping(value = "generate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public String storyWithStream(@RequestParam(defaultValue = "Tell a story in less than 100 words") String message) {
        log.info("Received story generation request with message: {}", message);
        return chatClient.prompt().user(message).call().content();
    }
    */

    /**
     * Generate a job application draft from the provided structured job form.
     *
     * @param jobForm the job form data used to build the AI prompt
     * @return a ResponseEntity containing the generated draft as JSON string
     */

    @PostMapping(value = "generate", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> generateJobApplicationDraft(@RequestBody JobFormDTO jobForm) {
        log.info("AI draft request received");
        return ResponseEntity.ok(aiService.generateJobApplicationDraft(jobForm));
    }
}
