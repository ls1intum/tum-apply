package de.tum.cit.aet.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO representing the current system-wide AI feature status.
 *
 * @param aiEnabled          true when AI features are fully available (manually enabled AND circuit breaker closed)
 * @param manuallyDisabled   true when an admin has explicitly disabled AI features
 * @param circuitBreakerOpen true when the circuit breaker tripped due to consecutive LLM failures
 * @param coolDownSeconds    the cooldown duration in seconds before the breaker transitions to half-open
 * @param openedAt           epoch millis when the breaker opened, or 0 when closed
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AiFeatureStatusDTO(
    boolean aiEnabled,
    boolean manuallyDisabled,
    boolean circuitBreakerOpen,
    long coolDownSeconds,
    long openedAt
) {}
