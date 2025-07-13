package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.usermanagement.dto.LoginRequestDTO;
import de.tum.cit.aet.usermanagement.dto.LoginResponseDTO;
import de.tum.cit.aet.usermanagement.service.KeycloakAuthenticationService;
import lombok.AllArgsConstructor;
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
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequest) {
        String token = keycloakAuthenticationService.loginWithCredentials(loginRequest.email(), loginRequest.password());
        return ResponseEntity.ok(new LoginResponseDTO(token));
    }
}
