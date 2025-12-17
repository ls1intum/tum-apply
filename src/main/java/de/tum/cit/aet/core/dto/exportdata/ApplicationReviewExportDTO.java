package de.tum.cit.aet.core.dto.exportdata;

import java.time.LocalDateTime;

public record ApplicationReviewExportDTO(String jobTitle, String applicantName, String reason, LocalDateTime reviewedAt) {}
