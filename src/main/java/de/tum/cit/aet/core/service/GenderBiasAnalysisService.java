package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.dto.BiasedWordDTO;
import de.tum.cit.aet.core.dto.GenderBiasAnalysisResponse;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Service for gender bias analysis
 */
@Service
public class GenderBiasAnalysisService {

    private final GenderBiasAnalyzer analyzer;

    public GenderBiasAnalysisService() {
        this.analyzer = new GenderBiasAnalyzer();
    }

    /**
     * Analyze text for gender bias
     */
    public GenderBiasAnalysisResponse analyzeText(String text, String language) {
        // Default to English if no language specified
        String effectiveLanguage = (language == null || language.trim().isEmpty()) ? "en" : language;

        // Perform analysis
        GenderBiasAnalyzer.AnalysisResult result = analyzer.analyze(text, effectiveLanguage);

        // Convert to DTO
        List<BiasedWordDTO> biasedWords = convertToWordDTOs(result);

        return new GenderBiasAnalysisResponse(result.getOriginalText(), biasedWords, result.getCoding(), result.getLanguage());
    }

    /**
     * Convert analysis result to DTOs with suggestions
     */
    private List<BiasedWordDTO> convertToWordDTOs(GenderBiasAnalyzer.AnalysisResult result) {
        List<BiasedWordDTO> dtos = new ArrayList<>();

        // Add masculine words
        for (String word : result.getMasculineWords()) {
            dtos.add(new BiasedWordDTO(word, "masculine"));
        }

        // Add feminine words
        for (String word : result.getFeminineWords()) {
            dtos.add(new BiasedWordDTO(word, "feminine"));
        }

        return dtos;
    }
}
