package de.tum.cit.aet.core.constants;

import java.util.Arrays;
import lombok.AllArgsConstructor;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum Language {
    GERMAN("de"),
    ENGLISH("en");

    private final String code;

    public static Language fromCode(String code) {
        return Arrays.stream(Language.values())
            .filter(e -> e.code.equals(code))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Invalid language code: " + code));
    }
}
