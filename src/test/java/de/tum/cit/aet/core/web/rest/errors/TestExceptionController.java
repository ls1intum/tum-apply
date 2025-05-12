package de.tum.cit.aet.core.web.rest.errors;

import de.tum.cit.aet.core.exception.*;
import java.util.ArrayList;
import java.util.List;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestExceptionController {

    @GetMapping("/not-found")
    public String triggerNotFound() {
        throw EntityNotFoundException.forId("User", 42);
    }

    @GetMapping("/bad-request")
    public String triggerBadRequest() {
        throw new IllegalArgumentException("Something went wrong");
    }

    @GetMapping("/invalid-param")
    public String triggerInvalidParameter() {
        throw new InvalidParameterException("Invalid parameter provided");
    }

    @GetMapping("/already-exists")
    public String triggerResourceAlreadyExists() {
        throw new ResourceAlreadyExistsException("Resource already exists");
    }

    @GetMapping("/unauthorized")
    public String triggerUnauthorized() {
        throw new UnauthorizedException("Unauthorized access");
    }

    @GetMapping("/forbidden")
    public String triggerAccessDenied() {
        throw new AccessDeniedException("Access denied");
    }

    @GetMapping("/not-allowed")
    public String triggerOperationNotAllowed() {
        throw new OperationNotAllowedException("Operation not allowed");
    }

    @GetMapping("/upload")
    public String triggerUploadException() {
        throw new UploadException("Upload failed");
    }

    @GetMapping("/mailing")
    public String triggerMailingException() {
        throw new MailingException("Mailing failed");
    }

    @GetMapping("/internal-error")
    public String triggerInternalServerError() {
        throw new InternalServerException("Internal server error");
    }

    @GetMapping("/validation-error")
    public String triggerValidationError() throws MethodArgumentNotValidException {
        // Simulate a validation error by throwing MethodArgumentNotValidException
        List<FieldError> fieldErrors = new ArrayList<>();
        fieldErrors.add(new FieldError("objectName", "field1", "must not be blank"));
        fieldErrors.add(new FieldError("objectName", "field2", "must be a valid email"));

        throw new MethodArgumentNotValidException(
            null,
            new org.springframework.validation.BeanPropertyBindingResult(new Object(), "objectName") {
                {
                    fieldErrors.forEach(this::addError);
                }
            }
        );
    }
}
