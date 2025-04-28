package de.tum.cit.aet.job.constants;

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
}
