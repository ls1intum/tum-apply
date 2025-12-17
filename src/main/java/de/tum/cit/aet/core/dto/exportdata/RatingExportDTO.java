package de.tum.cit.aet.core.dto.exportdata;

import java.time.Instant;

public record RatingExportDTO(String jobTitle, String applicantName, Integer rating, Instant createdAt) {}
