package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.dto.BiasedWordDTO;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import de.tum.cit.aet.core.util.GenderNeutralSuggestions;
import de.tum.cit.aet.core.web.GenderBiasAnalyzer;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service for gender bias analysis
 */
@Service
public class GenderBiasAnalysisService {

    private final GenderBiasAnalyzer analyzer;
    private final GenderNeutralSuggestions suggestions;

    public GenderBiasAnalysisService() {
        this.analyzer = new GenderBiasAnalyzer();
        this.suggestions = new GenderNeutralSuggestions();
    }

    /**
     * Analyze text for gender bias
     */
    public GenderBiasAnalysisResponse analyzeText(String text, String language) {
        // Default to English if no language specified
        if (language == null || language.trim().isEmpty()) {
            language = "en";
        }

        // Perform analysis
        GenderBiasAnalyzer.AnalysisResult result = analyzer.analyze(text, language);

        // Convert to DTO
        List<BiasedWordDTO> biasedWords = convertToWordDTOs(result);

        return new GenderBiasAnalysisResponse(
            result.getOriginalText(),
            biasedWords,
            result.getBiasScore(),
            result.getCoding(),
            result.getSuggestions(),
            result.getLanguage()
        );
    }

    /**
     * Convert analysis result to DTOs with suggestions
     */
    private List<BiasedWordDTO> convertToWordDTOs(GenderBiasAnalyzer.AnalysisResult result) {
        List<BiasedWordDTO> dtos = new ArrayList<>();
        String language = result.getLanguage();

        // Add masculine words
        for (String word : result.getMasculineWords()) {
            dtos.add(new BiasedWordDTO(word, "masculine", suggestions.getNeutralAlternative(word, "masculine", language)));
        }

        // Add feminine words
        for (String word : result.getFeminineWords()) {
            dtos.add(new BiasedWordDTO(word, "feminine", suggestions.getNeutralAlternative(word, "feminine", language)));
        }

        return dtos;
    }
}
