package de.tum.cit.aet.evaluation.constants;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum RejectReason {
    JOB_FILLED("JOB_FILLED"),
    JOB_OUTDATED("JOB_OUTDATED"),
    FAILED_REQUIREMENTS("FAILED_REQUIREMENTS"),
    OTHER_REASON("OTHER_REASON");

    private final String value;
}
