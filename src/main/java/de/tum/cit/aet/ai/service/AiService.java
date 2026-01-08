package de.tum.cit.aet.ai.service;

import de.tum.cit.aet.job.dto.JobFormDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

@Service
@Slf4j
public class AiService {

    private final String BASE_PROMPT = """
        You are an AI writing assistant for academic job postings at a prestigious university(TUM).

        Task:
        Write a polished job posting paragraph based on short bullet-point notes from a professor.
        Your output must be directly usable in a real advertisement with minimal editing.


        Writing style:
        1. Natural, human-sounding language
        2. Professional academic tone
        4. Specific to the job description
        5. Concise and precise
        6. Specific and informative
        7. Actionable and ready-to-use
        8. Do NOT mention AI, fairness, neutrality, compliance, or legal rules

        Safety and Fairness Requirements:
        1. AGG-compliant (Allgemeines Gleichbehandlungsgesetz)
        2. Gender-inclusive language
        3. Avoid biased or exclusionary wording
        4. Follow equal-opportunity hiring principles
        5. Avoid superlatives or culture-coded adjectives (e.g., “young”,"dynamic team",“dominant”,“aggressive”)

        Length:
        Maximum 200 words

        INPUT:
        Job Description: %s
        Requirements: %s
        Tasks: %s

        OUTPUT
        1. gender-inclusive
        2. AGG-compliant
        3. Do not explain your reasoning
        """;

    private final ChatClient chatClient;

    public AiService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    /**
     * Generates a polished job application draft from the provided job form data.
     * The draft is generated using the configured ChatClient with AGG\-compliant,
     * gender\-inclusive language.
     *
     * @param jobFormDTO the job form data containing description, requirements, and tasks
     * @return The generated job posting content
     */

    public String generateJobApplicationDraft(@RequestBody JobFormDTO jobFormDTO) {
        log.info("Calling AI draft generation ...");
        String prompt = BASE_PROMPT.formatted(jobFormDTO.description(), jobFormDTO.requirements(), jobFormDTO.tasks());
        return chatClient.prompt().user(prompt).call().content();
    }
}
