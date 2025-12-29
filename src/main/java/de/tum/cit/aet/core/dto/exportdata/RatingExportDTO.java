package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record RatingExportDTO(String jobTitle, String applicantName, Integer rating, LocalDateTime createdAt) {}
