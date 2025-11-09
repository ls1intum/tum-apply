package de.tum.cit.aet.core.dto;

/**
 * DTO for individual biased word
 */
public class BiasedWordDTO {

    private String word;
    private String type; // "masculine" or "feminine"
    private String suggestion;

    // Constructors
    public BiasedWordDTO() {}

    public BiasedWordDTO(String word, String type, String suggestion) {
        this.word = word;
        this.type = type;
        this.suggestion = suggestion;
    }

    // Getters and Setters
    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSuggestion() {
        return suggestion;
    }

    public void setSuggestion(String suggestion) {
        this.suggestion = suggestion;
    }
}
