package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.util.HttpUtils;
import de.tum.cit.aet.usermanagement.service.EmailVerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes side-effect-free OTP operations such as sending verification codes and optionally verifying them.
 * The verify-code endpoint is optional in production environments because the /otp-complete endpoint orchestrates verification.
 */
@RestController
@RequestMapping("/api/auth")
public class EmailVerificationResource {
    private final EmailVerificationService service;

    public EmailVerificationResource(EmailVerificationService service) {
        this.service = service;
    }

    /**
     * Handles the request to send a verification code to the specified email.
     * Extracts the email and client IP address from the request, then delegates
     * the sending of the code to the email verification service.
     *
     * @param body    the request body containing the email address
     * @param request the HTTP servlet request, used to extract the client IP address
     * @return HTTP 202 Accepted if the request to send a code was processed
     */
    @PostMapping("/send-code")
    public ResponseEntity<Void> send(@Valid @RequestBody SendCodeRequest body, HttpServletRequest request) {
        String email = body.email();
        service.sendCode(email, HttpUtils.getClientIp(request));
        return ResponseEntity.accepted().build();
    }

    public record SendCodeRequest(
        @NotBlank @Email String email
    ) {
    }
}
