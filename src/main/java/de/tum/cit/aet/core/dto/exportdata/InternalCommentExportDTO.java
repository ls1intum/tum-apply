package de.tum.cit.aet.core.dto.exportdata;

import java.time.Instant;

public record InternalCommentExportDTO(String jobTitle, String applicantName, String message, Instant createdAt) {}
