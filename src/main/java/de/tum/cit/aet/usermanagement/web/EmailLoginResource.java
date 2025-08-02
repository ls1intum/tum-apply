package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.usermanagement.dto.LoginRequestDTO;
import de.tum.cit.aet.usermanagement.service.KeycloakAuthenticationService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
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

    /**
     * Authenticates a user via email and password and sets an access token as an HttpOnly cookie.
     *
     * @param loginRequest the DTO containing the user's email and password
     * @param response     the HTTP servlet response used to set the authentication cookie
     * @return HTTP 200 OK if login is successful and the cookie is set
     * @throws UnauthorizedException if login credentials are invalid
     */
    @PostMapping("/login")
    public ResponseEntity<Void> login(@Valid @RequestBody LoginRequestDTO loginRequest, HttpServletResponse response) {
        String token = keycloakAuthenticationService.loginWithCredentials(loginRequest.email(), loginRequest.password());

        ResponseCookie cookie = ResponseCookie.from("access_token", token)
            .httpOnly(true)
            .secure(true)
            .sameSite("Lax")
            .path("/")
            .maxAge(Duration.ofHours(1))
            .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok().build();
    }
}
