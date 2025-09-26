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
    GARCHING("GARCHING"),
    GARCHING_HOCHBRUECK("GARCHING_HOCHBRUECK"),
    HEILBRONN("HEILBRONN"),
    MUNICH("MUNICH"),
    STRAUBING("STRAUBING"),
    WEIHENSTEPHAN("WEIHENSTEPHAN"),
    SINGAPORE("SINGAPORE");

    private final String value;

    private static final Map<String, Campus> LOOKUP = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(
                    Campus::getValue, Function.identity()));

    public static Campus fromValue(String value) {
        if (value == null)
            return null;
        return LOOKUP.get(value.toUpperCase(Locale.ROOT));
    }
}
