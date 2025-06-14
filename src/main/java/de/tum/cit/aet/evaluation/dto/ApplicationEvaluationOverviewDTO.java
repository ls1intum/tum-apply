package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import java.time.ZonedDateTime;
import java.util.UUID;

public record ApplicationEvaluationOverviewDTO(
    UUID applicationId,
    String avatar,
    String name,
    ApplicationState state,
    String jobName,
    Integer rating,
    ZonedDateTime appliedAt
) {}
