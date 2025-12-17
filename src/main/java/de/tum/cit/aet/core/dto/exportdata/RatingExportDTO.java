package de.tum.cit.aet.core.dto.exportdata;

import java.time.LocalDateTime;

public record RatingExportDTO(String jobTitle, String applicantName, Integer rating, LocalDateTime createdAt) {}
