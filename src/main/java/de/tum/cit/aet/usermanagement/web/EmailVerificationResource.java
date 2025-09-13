package de.tum.cit.aet.usermanagement.web;

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
     * @param body the request body containing the email address
     * @param req  the HTTP servlet request
     * @return a ResponseEntity with HTTP status 202 (Accepted)
     */
    @PostMapping("/send-code")
    public ResponseEntity<Void> send(@Valid @RequestBody SendCodeRequest body, HttpServletRequest req) {
        String email = body.email();
        String ip = clientIp(req);
        service.sendCode(email, ip);
        return ResponseEntity.accepted().build();
    }

    /**
     * Verifies a submitted verification code for the given email address.
     * Checks the code via the email verification service and returns an appropriate
     * HTTP response indicating success or failure.
     *
     * @param body the request body containing the email and verification code
     * @param req  the HTTP servlet request
     * @return a ResponseEntity with HTTP status 204 (No Content) if successful
     */
    @PostMapping("/verify-code")
    public ResponseEntity<Void> verify(@Valid @RequestBody VerifyCodeRequest body, HttpServletRequest req) {
        String email = body.email();
        String code = body.code();
        String ip = clientIp(req);
        service.verifyCode(email, code, ip);
        return ResponseEntity.noContent().build();
    }

    /**
     * Resolves the client's IP address from the HTTP request.
     * Prefers the 'X-Forwarded-For' header if present to handle proxies,
     * otherwise falls back to the remote address.
     *
     * @param req the HTTP servlet request
     * @return the resolved client IP address as a String
     */
    private String clientIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    public record SendCodeRequest(
        @NotBlank @Email String email
    ) {
    }

    public record VerifyCodeRequest(
        @NotBlank @Email String email,
        @NotBlank String code
    ) {
    }
}
