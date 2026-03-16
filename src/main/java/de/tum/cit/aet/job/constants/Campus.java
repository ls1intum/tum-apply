package de.tum.cit.aet.job.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Campus implements LocalizedEnum {
    GARCHING("Garching", "Garching"),
    GARCHING_HOCHBRUECK("Garching Hochbrueck", "Garching-Hochbrück"),
    HEILBRONN("Heilbronn", "Heilbronn"),
    MUNICH("Munich", "München"),
    STRAUBING("Straubing", "Straubing"),
    WEIHENSTEPHAN("Weihenstephan", "Weihenstephan"),
    SINGAPORE("Singapore", "Singapur");

    private final String englishValue;
    private final String germanValue;

    public static Campus fromValue(String value) {
        return LocalizedEnum.fromValue(Campus.class, value);
    }
}
