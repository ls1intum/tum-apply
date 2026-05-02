package de.tum.cit.aet.evaluation.constants;

import de.tum.cit.aet.notification.constants.EmailType;
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

    /**
     * Maps this reject reason to the corresponding {@link EmailType} variant used to
     * select the rejection template at send time.
     *
     * @return the matching {@link EmailType} for this reject reason
     */
    public EmailType toEmailType() {
        return switch (this) {
            case JOB_FILLED -> EmailType.APPLICATION_REJECTED_JOB_FILLED;
            case JOB_OUTDATED -> EmailType.APPLICATION_REJECTED_JOB_OUTDATED;
            case FAILED_REQUIREMENTS -> EmailType.APPLICATION_REJECTED_FAILED_REQUIREMENTS;
            case OTHER_REASON -> EmailType.APPLICATION_REJECTED_OTHER_REASON;
        };
    }
}
