package de.tum.cit.aet.application.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ApplicationStatus {
    ACCEPTED("ACCEPTED"),
    INTERVIEW("INTERVIEW"),
    APPROVALLISTED("APPROVALLISTED"),
    REJECTED("REJECTED");

    private final String value;
}
