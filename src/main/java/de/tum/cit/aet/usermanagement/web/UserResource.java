package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.UpdateUserNameDTO;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserResource {

    private final AuthenticationService authenticationService;
    private final UserService userService;

    public UserResource(AuthenticationService authenticationService, UserService userService) {
        this.authenticationService = authenticationService;
        this.userService = userService;
    }

    /**
     * Returns information about the currently authenticated user.
     * If the user does not exist yet, a new user is created and assigned a default role.
     * If no JWT is present, or it is not valid, the response will HTTP 401 Unauthorized.
     *
     * @param jwt the JWT of the authenticated user, injected by Spring Security
     * @return the user data as {@link UserShortDTO}, or an empty response if unauthenticated
     */
    @GetMapping("/me")
    public ResponseEntity<UserShortDTO> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.ok().build(); // no token = no user
        }

        User user = authenticationService.provisionUserIfMissing(jwt);
        return ResponseEntity.ok(new UserShortDTO(user));
    }

    /**
     * Update the first and last name of a user.
     */
    @PutMapping("/name")
    public ResponseEntity<Void> updateUserName(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody UpdateUserNameDTO updateUserNameDTO) {
        userService.updateNames(jwt.getSubject(), updateUserNameDTO.firstName(), updateUserNameDTO.lastName());
        return ResponseEntity.noContent().build();
    }
}
