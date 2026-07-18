package de.tum.cit.aet.ai.dto;

import de.tum.cit.aet.ai.constants.AiUsageFeature;
import java.util.List;

/**
 * One AI feature's trigger counts, aligned position-for-position with the shared label axis
 * of the enclosing {@link AiUsageAnalyticsDTO}.
 *
 * @param feature the AI feature this series describes
 * @param counts  the number of triggers per time bucket, in label order
 */
public record AiUsageSeriesDTO(AiUsageFeature feature, List<Long> counts) {}
