package de.tum.cit.aet.core.dto;

import de.tum.cit.aet.core.constants.ErrorCode;
import de.tum.cit.aet.core.exception.errors.ValidationFieldError;
import java.time.Instant;
import java.util.List;

public record ApiError(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path,
    ErrorCode errorCode,
    List<ValidationFieldError> fieldErrors
) {
    public ApiError(Instant timestamp, int status, String error, String message, String path, ErrorCode errorCode) {
        this(timestamp, status, error, message, path, errorCode, null);
    }
}
