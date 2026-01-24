package de.tum.cit.aet.core.dto;

import de.tum.cit.aet.core.constants.DataExportState;
import java.time.LocalDateTime;

public record DataExportStatusDTO(
    DataExportState status,
    LocalDateTime lastRequestedAt,
    LocalDateTime nextAllowedAt,
    long cooldownSeconds,
    String downloadToken
) {}
