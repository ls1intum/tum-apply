package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.UpdateUserNameDTO;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.service.KeycloakUserService;
import de.tum.cit.aet.usermanagement.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserResource {

    private final AuthenticationService authenticationService;
    private final UserService userService;
    private final KeycloakUserService keycloakUserService;

    public UserResource(AuthenticationService authenticationService, UserService userService, KeycloakUserService keycloakUserService) {
        this.authenticationService = authenticationService;
        this.userService = userService;
        this.keycloakUserService = keycloakUserService;
    }

    /**
     * Returns information about the currently authenticated user.
     * If the user does not exist yet, a new user is created and assigned a default role.
     * If no JWT is present, or it is not valid, the response will HTTP 401 Unauthorized.
     *
     * @param jwt of the authenticated user
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
     * Allows the currently authenticated user to update their first and last name.
     *
     * @param jwt               of the authenticated user
     * @param updateUserNameDTO contains the new first and last name
     * @return 204 No Content if updated successfully
     */
    @PutMapping("/name")
    public ResponseEntity<Void> updateUserName(@AuthenticationPrincipal Jwt jwt,
                                               @Valid @RequestBody UpdateUserNameDTO updateUserNameDTO) {
        userService.updateNames(jwt.getSubject(), updateUserNameDTO.firstName(), updateUserNameDTO.lastName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Allows the currently authenticated user to set or change their password in Keycloak.
     *
     * @param jwt of the authenticated user
     * @param dto contains the new password
     * @return 204 No Content if updated successfully, 400 Bad Request if update fails
     */
    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdatePasswordDTO dto) {
        boolean updated = keycloakUserService.setPassword(jwt.getSubject(), dto.newPassword());
        return updated ? ResponseEntity.noContent().build() : ResponseEntity.badRequest().build();
    }

    public record UpdatePasswordDTO(
        @NotBlank String newPassword
    ) {
    }
}
