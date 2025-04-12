package de.tum.cit.aet.core.domain.constants;

import lombok.Getter;

@Getter
public enum DocumentType {
    BACHELOR_TRANSCRIPT("BACHELOR_TRANSCRIPT"),
    MASTER_TRANSCRIPT("MASTER_TRANSCRIPT"),
    CV("CV"),
    CUSTOM("CUSTOM");

    private final String value;

    DocumentType(String value) {
        this.value = value;
    }
}
