package de.tum.cit.aet.core.dto;

import java.util.List;

/**
 * Response DTO for gender bias analysis
 */
public class GenderBiasAnalysisResponse {

    private String originalText;
    private List<BiasedWordDTO> biasedWords;
    private double biasScore;
    private String coding;
    private List<String> suggestions;
    private String language;

    // Constructors
    public GenderBiasAnalysisResponse() {}

    public GenderBiasAnalysisResponse(
        String originalText,
        List<BiasedWordDTO> biasedWords,
        double biasScore,
        String coding,
        List<String> suggestions,
        String language
    ) {
        this.originalText = originalText;
        this.biasedWords = biasedWords;
        this.biasScore = biasScore;
        this.coding = coding;
        this.suggestions = suggestions;
        this.language = language;
    }

    // Getters and Setters
    public String getOriginalText() {
        return originalText;
    }

    public void setOriginalText(String originalText) {
        this.originalText = originalText;
    }

    public List<BiasedWordDTO> getBiasedWords() {
        return biasedWords;
    }

    public void setBiasedWords(List<BiasedWordDTO> biasedWords) {
        this.biasedWords = biasedWords;
    }

    public double getBiasScore() {
        return biasScore;
    }

    public void setBiasScore(double biasScore) {
        this.biasScore = biasScore;
    }

    public String getCoding() {
        return coding;
    }

    public void setCoding(String coding) {
        this.coding = coding;
    }

    public List<String> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<String> suggestions) {
        this.suggestions = suggestions;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
