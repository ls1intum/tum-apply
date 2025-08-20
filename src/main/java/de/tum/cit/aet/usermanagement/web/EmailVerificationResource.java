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

    @PostMapping("/send-code")
    public ResponseEntity<Void> send(@Valid @RequestBody SendCodeRequest body, HttpServletRequest req) {
        String email = body.email();
        String ip = clientIp(req);
        service.sendCode(email, ip);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/verify-code")
    public ResponseEntity<Void> verify(@Valid @RequestBody VerifyCodeRequest body, HttpServletRequest req) {
        String email = body.email();
        String code = body.code();
        String ip = clientIp(req);
        service.verifyCode(email, code, ip);
        return ResponseEntity.noContent().build();
    }

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
