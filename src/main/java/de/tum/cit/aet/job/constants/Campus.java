package de.tum.cit.aet.job.constants;

import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Campus {
    GARCHING("Garching", "Garching"),
    GARCHING_HOCHBRUECK("Garching Hochbrueck", "Garching-Hochbrück"),
    HEILBRONN("Heilbronn", "Heilbronn"),
    MUNICH("Munich", "München"),
    STRAUBING("Straubing", "Straubing"),
    WEIHENSTEPHAN("Weihenstephan", "Weihenstephan"),
    SINGAPORE("Singapore", "Singapur");

    private final String englishValue;
    private final String germanValue;

    private static final Map<String, Campus> LOOKUP = Arrays.stream(values()).collect(
        Collectors.toUnmodifiableMap(Campus::getEnglishValue, Function.identity())
    );

    public static Campus fromValue(String value) {
        if (value == null) {
            return null;
        }
        return LOOKUP.get(value.toUpperCase(Locale.ROOT));
    }
}
