package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Request DTO for gender bias analysis
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GenderBiasAnalysisRequest {

    private String text;
    private String language; // "en" or "de"

    // Constructors
    public GenderBiasAnalysisRequest() {}

    public GenderBiasAnalysisRequest(String text, String language) {
        this.text = text;
        this.language = language;
    }

    // Getters and Setters
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
