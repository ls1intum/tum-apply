package de.tum.cit.aet.core.dto;

import java.util.List;

/**
 * Response DTO for gender bias analysis
 */
public class GenderBiasAnalysisResponse {

    private String originalText;
    private List<BiasedWordDTO> biasedWords;
    private String coding;
    private String language;

    // Constructors
    public GenderBiasAnalysisResponse() {}

    public GenderBiasAnalysisResponse(String originalText, List<BiasedWordDTO> biasedWords, String coding, String language) {
        this.originalText = originalText;
        this.biasedWords = biasedWords;
        this.coding = coding;
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

    public String getCoding() {
        return coding;
    }

    public void setCoding(String coding) {
        this.coding = coding;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
