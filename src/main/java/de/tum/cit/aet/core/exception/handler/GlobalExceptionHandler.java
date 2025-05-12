package de.tum.cit.aet.core.exception.handler;

import de.tum.cit.aet.core.constants.ErrorCode;
import de.tum.cit.aet.core.dto.ApiError;
import de.tum.cit.aet.core.exception.*;
import de.tum.cit.aet.core.exception.errors.ValidationFieldError;
import jakarta.servlet.http.HttpServletRequest;
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

    private record ExceptionMetadata(HttpStatus status, ErrorCode code) {}
}
