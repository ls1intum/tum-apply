package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import java.time.Instant;
import java.util.UUID;

public record ApplicationEvaluationOverviewDTO(
    UUID applicationId,
    String avatar,
    String name,
    ApplicationState state,
    String jobName,
    Integer rating,
    Instant appliedAt
) {}
