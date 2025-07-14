package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.usermanagement.dto.LoginRequestDTO;
import de.tum.cit.aet.usermanagement.service.KeycloakAuthenticationService;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
public class EmailLoginResource {

    private final KeycloakAuthenticationService keycloakAuthenticationService;

    @PostMapping("/login")
    public ResponseEntity<Void> login(@RequestBody LoginRequestDTO loginRequest, HttpServletResponse response) {
        String token = keycloakAuthenticationService.loginWithCredentials(loginRequest.email(), loginRequest.password());

        ResponseCookie cookie = ResponseCookie.from("access_token", token)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/")
            .maxAge(Duration.ofHours(1))
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok().build();
    }
}
