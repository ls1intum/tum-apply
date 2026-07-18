package de.tum.cit.aet.ai.dto;

import de.tum.cit.aet.ai.constants.AiUsageFeature;
import java.time.LocalDateTime;

/**
 * Lightweight projection of an AI usage event carrying only the fields needed for
 * time-bucket aggregation, so the analytics query never loads the referenced user.
 *
 * @param feature   the AI feature that was triggered
 * @param createdAt the moment the feature was triggered
 * @param success   whether the underlying AI call completed successfully
 */
public record AiUsageEventPoint(AiUsageFeature feature, LocalDateTime createdAt, boolean success) {}
