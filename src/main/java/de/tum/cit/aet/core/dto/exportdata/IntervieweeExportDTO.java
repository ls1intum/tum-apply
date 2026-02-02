package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record IntervieweeExportDTO(String jobTitle, Instant lastInvited) {}
