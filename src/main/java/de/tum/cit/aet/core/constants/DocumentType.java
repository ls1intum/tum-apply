package de.tum.cit.aet.core.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DocumentType {
    BACHELOR_TRANSCRIPT("BACHELOR_TRANSCRIPT"),
    MASTER_TRANSCRIPT("MASTER_TRANSCRIPT"),
    CV("CV"),
    CUSTOM("CUSTOM");

    private final String value;
}
