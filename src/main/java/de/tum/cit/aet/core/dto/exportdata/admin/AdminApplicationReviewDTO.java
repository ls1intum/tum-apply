package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.UUID;

/** Flat representation of an {@link de.tum.cit.aet.evaluation.domain.ApplicationReview}. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminApplicationReviewDTO(UUID applicationReviewId, UUID reviewedByUserId, String reason, LocalDateTime reviewedAt) {}
