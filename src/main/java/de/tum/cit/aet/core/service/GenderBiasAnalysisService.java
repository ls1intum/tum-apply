package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.dto.BiasedWordDTO;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Service for gender bias analysis
 */
@Service
@RequiredArgsConstructor
public class GenderBiasAnalysisService {

    private final GenderBiasAnalyzer analyzer;

    /**
     * Analyze the given text for gender bias.
     *
     * @param text     the text to analyze
     * @param language the language code (e.g., "en" or "de")
     * @return a response containing the analysis result and identified biased words
     */
    public GenderBiasAnalysisResponse analyzeText(String text, String language) {
        // Default to English if no language specified
        String effectiveLanguage = (language == null || language.trim().isEmpty()) ? "en" : language;

        // Perform analysis
        GenderBiasAnalyzer.AnalysisResult result = analyzer.analyze(text, effectiveLanguage);

        // Convert to DTO
        List<BiasedWordDTO> biasedWords = convertToWordDTOs(result);

        return new GenderBiasAnalysisResponse(result.originalText(), biasedWords, result.coding(), result.language());
    }

    /**
     * Convert analysis result to DTOs with suggestions
     */
    private List<BiasedWordDTO> convertToWordDTOs(GenderBiasAnalyzer.AnalysisResult result) {
        List<BiasedWordDTO> dtos = new ArrayList<>();

        // Add non inslusive words
        for (String word : result.nonInclusiveWords()) {
            dtos.add(new BiasedWordDTO(word, "non-inclusive"));
        }

        // Add inclusive words
        for (String word : result.inclusiveWords()) {
            dtos.add(new BiasedWordDTO(word, "inclusive"));
        }

        return dtos;
    }
}
