package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserResource {

    private final AuthenticationService authenticationService;

    public UserResource(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserShortDTO> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.ok().build(); // no token = no user
        }

        String preferredUsername = jwt.getClaimAsString("preferred_username");
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");

        User user = authenticationService.provisionUserIfMissing(preferredUsername, firstName, lastName);
        return ResponseEntity.ok(new UserShortDTO(user));
    }
}
