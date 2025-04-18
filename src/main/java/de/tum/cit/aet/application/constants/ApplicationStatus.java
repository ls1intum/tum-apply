package de.tum.cit.aet.application.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ApplicationStatus {
    SAVED("SAVED", ApplicationStatusIssuer.APPLICANT),
    SENT("SENT", ApplicationStatusIssuer.APPLICANT),
    ACCEPTED("ACCEPTED", ApplicationStatusIssuer.SUPERVISOR),
    IN_REVIEW("IN_REVIEW", ApplicationStatusIssuer.SUPERVISOR),
    REJECTED("REJECTED", ApplicationStatusIssuer.SUPERVISOR),
    WITHDRAWN("WITHDRAWN", ApplicationStatusIssuer.APPLICANT);

    private final String value;
    private final ApplicationStatusIssuer applicationStatusIssuer;
}

@Getter
@AllArgsConstructor
enum ApplicationStatusIssuer {
    SUPERVISOR("SUPERVISOR"),
    APPLICANT("APPLICANT")
    /* TODO when we introduce admin abilities, 
       it would make sense to have admin induced Applicationstatuses like FLAGGED (if someone misbehaves) or ARCHIVED f.e. */
    // ADMIN("ADMIN")
    ;

    private String value;
}
