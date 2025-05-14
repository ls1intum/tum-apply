package de.tum.cit.aet.core.web.rest.errors;

import de.tum.cit.aet.core.exception.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/test")
@Validated
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

    @PostMapping("/validation-error")
    public void triggerValidationError(@Valid @RequestBody ValidationTestDto dto) {
        // method body can remain empty
    }

    @GetMapping("/constraint-violation")
    public void triggerConstraintViolation(@RequestParam @NotBlank(message = "must not be blank") String param) {
        // nothing needed here
    }
}
