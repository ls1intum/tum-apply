package de.tum.cit.aet.ai.dto;

/**
 * DTO representing the current system-wide AI feature status.
 *
 * @param aiEnabled          true when AI features are fully available (manually enabled AND circuit breaker closed)
 * @param manuallyDisabled   true when an admin has explicitly disabled AI features
 * @param circuitBreakerOpen true when the circuit breaker tripped due to consecutive LLM failures
 */
public record AiFeatureStatusDTO(boolean aiEnabled, boolean manuallyDisabled, boolean circuitBreakerOpen) {}
