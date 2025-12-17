package de.tum.cit.aet.core.dto.exportdata;

import java.time.LocalDateTime;

public record InternalCommentExportDTO(String jobTitle, String applicantName, String message, LocalDateTime createdAt) {}
