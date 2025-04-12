package de.tum.cit.aet.core.domain.constants;

public enum DocumentType {
    BACHELOR_TRANSCRIPT("BACHELOR_TRANSCRIPT"),
    MASTER_TRANSCRIPT("MASTER_TRANSCRIPT"),
    CV("CV"),
    CUSTOM("CUSTOM");

    private String value;

    DocumentType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
