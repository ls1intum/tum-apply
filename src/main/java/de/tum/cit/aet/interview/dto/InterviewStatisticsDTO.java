package de.tum.cit.aet.interview.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import java.util.UUID;

/**
 * DTO for projecting interview statistics directly from database queries.
 * Used to efficiently aggregate application counts by job and state.
 */
public record InterviewStatisticsDTO(UUID jobId, ApplicationState state, Long count) {}
