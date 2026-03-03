package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record InternalCommentExportDTO(String jobTitle, String applicantName, String message, Instant createdAt) {}
