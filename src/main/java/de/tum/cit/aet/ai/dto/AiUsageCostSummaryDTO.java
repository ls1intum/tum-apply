package de.tum.cit.aet.ai.dto;

/**
 * Aggregate token consumption and estimated monetary cost of AI usage over the selected range.
 *
 * @param inputTokens   total prompt tokens consumed
 * @param outputTokens  total completion tokens produced
 * @param totalTokens   total tokens (input + output)
 * @param estimatedCost estimated cost in {@code currency}, derived from configured per-model rates
 * @param currency      currency label for {@code estimatedCost} (e.g. "EUR")
 */
public record AiUsageCostSummaryDTO(long inputTokens, long outputTokens, long totalTokens, double estimatedCost, String currency) {}
