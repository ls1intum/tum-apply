package de.tum.cit.aet.application.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ApplicationStatus {
    ACCEPTED("ACCEPTED"),
    IN_REVIEW("IN_REVIEW"),
    REJECTED("REJECTED");

    private final String value;
}
