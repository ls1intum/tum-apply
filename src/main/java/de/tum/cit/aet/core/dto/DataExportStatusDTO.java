package de.tum.cit.aet.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.constants.DataExportState;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DataExportStatusDTO(
    DataExportState status,
    LocalDateTime lastRequestedAt,
    LocalDateTime nextAllowedAt,
    long cooldownSeconds,
    String downloadToken
) {}
