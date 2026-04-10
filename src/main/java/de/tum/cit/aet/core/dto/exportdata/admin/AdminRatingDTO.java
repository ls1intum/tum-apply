package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.UUID;

/** Flat representation of an {@link de.tum.cit.aet.evaluation.domain.Rating}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminRatingDTO(UUID ratingId, UUID fromUserId, Integer rating, LocalDateTime createdAt) {}
