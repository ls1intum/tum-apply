package de.tum.cit.aet.evaluation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;

public record RejectDTO(@NotNull RejectReason reason, boolean notifyApplicant) {}

@Getter
@AllArgsConstructor
enum RejectReason {
    JOB_FILLED("JOB_FILLED"),
    JOB_OUTDATED("JOB_OUTDATED"),
    FAILED_REQUIREMENTS("FAILED_REQUIREMENTS"),
    OTHER_REASON("OTHER_REASON");

    private final String value;
}
