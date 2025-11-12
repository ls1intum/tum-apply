package de.tum.cit.aet.core.dto;

/**
 * DTO for individual biased word
 */
public class BiasedWordDTO {

    private String word;
    private String type; // "masculine" or "feminine"

    // Constructors
    public BiasedWordDTO() {}

    public BiasedWordDTO(String word, String type) {
        this.word = word;
        this.type = type;
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
}
