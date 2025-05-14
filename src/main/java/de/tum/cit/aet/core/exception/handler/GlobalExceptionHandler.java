package de.tum.cit.aet.core.exception.handler;

import de.tum.cit.aet.core.constants.ErrorCode;
import de.tum.cit.aet.core.dto.ApiError;
import de.tum.cit.aet.core.exception.*;
import de.tum.cit.aet.core.exception.errors.ValidationFieldError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

/**
 * Global exception handler for all unhandled runtime and validation exceptions in the application.
 * Provides consistent error responses to the client using ApiError structure and error codes.
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final Map<Class<? extends RuntimeException>, ExceptionMetadata> EXCEPTION_METADATA = Map.ofEntries(
        Map.entry(EntityNotFoundException.class, new ExceptionMetadata(HttpStatus.NOT_FOUND, ErrorCode.ENTITY_NOT_FOUND)),
        Map.entry(ResourceAlreadyExistsException.class, new ExceptionMetadata(HttpStatus.CONFLICT, ErrorCode.RESOURCE_ALREADY_EXISTS)),
        Map.entry(InvalidParameterException.class, new ExceptionMetadata(HttpStatus.BAD_REQUEST, ErrorCode.INVALID_PARAMETER)),
        Map.entry(OperationNotAllowedException.class, new ExceptionMetadata(HttpStatus.BAD_REQUEST, ErrorCode.OPERATION_NOT_ALLOWED)),
        Map.entry(UploadException.class, new ExceptionMetadata(HttpStatus.BAD_REQUEST, ErrorCode.UPLOAD_FAILED)),
        Map.entry(AccessDeniedException.class, new ExceptionMetadata(HttpStatus.FORBIDDEN, ErrorCode.ACCESS_DENIED)),
        Map.entry(UnauthorizedException.class, new ExceptionMetadata(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED)),
        Map.entry(MailingException.class, new ExceptionMetadata(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.MAILING_ERROR)),
        Map.entry(InternalServerException.class, new ExceptionMetadata(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR))
    );

    /**
     * Handles all runtime exceptions and validation errors.
     * Maps them to appropriate HTTP responses and error codes.
     *
     * @param ex      the exception that was thrown
     * @param request the current HTTP request
     * @return a ResponseEntity with a structured ApiError body
     */
    @ExceptionHandler({ RuntimeException.class, MethodArgumentNotValidException.class })
    public ResponseEntity<Object> handleRuntime(Exception ex, HttpServletRequest request) {
        if (ex instanceof MethodArgumentNotValidException manve) {
            log.warn("Handled validation exception: {} - Path: {}", ex.getClass().getSimpleName(), request.getRequestURI(), ex);
            List<ValidationFieldError> fieldErrors = manve
                .getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> new ValidationFieldError(fe.getObjectName(), fe.getField(), fe.getDefaultMessage()))
                .collect(Collectors.toList());
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, ex, request.getRequestURI(), fieldErrors);
        }
        if (ex instanceof ConstraintViolationException cve) {
            log.warn("Handled constraint validation exception: {} - Path: {}", ex.getClass().getSimpleName(), request.getRequestURI(), ex);
            List<ValidationFieldError> fieldErrors = cve
                .getConstraintViolations()
                .stream()
                .map(v -> new ValidationFieldError(v.getRootBeanClass().getSimpleName(), v.getPropertyPath().toString(), v.getMessage()))
                .collect(Collectors.toList());
            return buildErrorResponse(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, ex, request.getRequestURI(), fieldErrors);
        }
        ExceptionMetadata metadata = EXCEPTION_METADATA.getOrDefault(
            ex.getClass(),
            new ExceptionMetadata(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR)
        );
        if (metadata.status().is5xxServerError()) {
            log.error("Handled exception: {} - Path: {}", ex.getClass().getSimpleName(), request.getRequestURI(), ex);
        } else {
            log.warn("Handled exception: {} - Path: {}", ex.getClass().getSimpleName(), request.getRequestURI(), ex);
        }
        return buildErrorResponse(metadata.status(), metadata.code(), ex, request.getRequestURI(), null);
    }

    /**
     * Builds a standardized API error response object from the given exception and metadata.
     *
     * @param status      the HTTP status to return
     * @param code        the application-specific error code
     * @param ex          the thrown exception
     * @param path        the request URI that caused the error
     * @param fieldErrors optional list of field-level validation errors (null if not applicable)
     * @return a ResponseEntity containing the ApiError
     */
    private ResponseEntity<Object> buildErrorResponse(
        HttpStatus status,
        ErrorCode code,
        Exception ex,
        String path,
        List<ValidationFieldError> fieldErrors
    ) {
        ApiError error = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), ex.getMessage(), path, code, fieldErrors);
        return new ResponseEntity<>(error, status);
    }

    /**
     * Metadata record for mapping exceptions to corresponding HTTP status and error code.
     *
     * @param status the HTTP status to return
     * @param code   the error code associated with the exception
     */
    private record ExceptionMetadata(HttpStatus status, ErrorCode code) {}
}
