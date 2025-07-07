package de.tum.cit.aet.core.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum Language {
    GERMAN("de"),
    ENGLISH("en");

    private final String code;
}
