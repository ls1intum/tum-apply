package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.evaluation.constants.RejectReason;
import jakarta.validation.constraints.NotNull;

public record RejectDTO(@NotNull RejectReason reason, boolean notifyApplicant) {}
