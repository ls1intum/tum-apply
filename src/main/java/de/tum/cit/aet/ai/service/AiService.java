package de.tum.cit.aet.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.ai.exception.AiPromptException;
import de.tum.cit.aet.ai.exception.AiResponseException;
import de.tum.cit.aet.job.dto.AiResponseDTO;
import de.tum.cit.aet.job.dto.JobFormDTO;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.RequestBody;

@Service
@Slf4j
public class AiService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final String jobDescriptionGenerationPrompt;

    public AiService(
        ChatClient chatClient,
        ObjectMapper objectMapper,
        @Value("classpath:prompts/JobDescriptionGeneration.txt") Resource promptResource
    ) {
        this.chatClient = chatClient;
        this.objectMapper = objectMapper;

        try (InputStream inputStream = promptResource.getInputStream()) {
            this.jobDescriptionGenerationPrompt = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new AiPromptException(e);
        }
    }

    /**
     * Generates a polished job application draft from the provided job form data.
     * The draft is generated using the configured ChatClient with AGG\-compliant,
     * gender\-inclusive language.
     *
     * @param jobFormDTO the job form data containing description, requirements, and tasks
     * @return The generated job posting content
     */

    public AiResponseDTO generateJobApplicationDraft(@RequestBody JobFormDTO jobFormDTO) {
        String prompt = jobDescriptionGenerationPrompt.formatted(jobFormDTO.description(), jobFormDTO.requirements(), jobFormDTO.tasks());
        String raw = chatClient.prompt().user(prompt).call().content();
        String cleanedJSON = cleanupJSON(raw);
        try {
            return objectMapper.readValue(cleanedJSON, AiResponseDTO.class);
        } catch (JsonProcessingException e) {
            throw new AiResponseException(e);
        }
    }

    /**
     * Sanitizes raw AI output and extracts the substring between the first '{' and the last '}'
     *
     * @param aiResponse the raw response from the ChatClient
     * @return cleaned JSON string or "{}" if input is null or empty
     */

    private String cleanupJSON(String aiResponse) {
        if (aiResponse == null) return "{}";
        // removes markdown code fences
        String result = aiResponse.replace("```json", "").replace("```", "").trim();

        result = result.replace(", }", "}").replace(",}", "}").replace(", ]", "]").replace(",]", "]");

        int start = result.indexOf('{');
        int end = result.lastIndexOf('}');

        if (start >= 0 && end > start) {
            result = result.substring(start, end + 1);
        }
        return result;
    }
}
