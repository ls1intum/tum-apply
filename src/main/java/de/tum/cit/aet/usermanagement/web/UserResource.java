package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.dto.PageDTO;
import de.tum.cit.aet.core.dto.PageResponseDTO;
import de.tum.cit.aet.core.security.annotations.Authenticated;
import de.tum.cit.aet.core.security.annotations.ProfessorOrEmployeeOrAdmin;
import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.KeycloakUserDTO;
import de.tum.cit.aet.usermanagement.dto.UpdateUserNameDTO;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.service.KeycloakUserService;
import de.tum.cit.aet.usermanagement.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserResource {

    private final AuthenticationService authenticationService;
    private final UserService userService;
    private final KeycloakUserService keycloakUserService;

    /**
     * Returns information about the currently authenticated user.
     * If the user does not exist yet, a new user is created and assigned a default role.
     *
     * @param jwt of the authenticated user
     * @return the user data as {@link UserShortDTO}, or an empty response if unauthenticated
     */
    @Authenticated
    @GetMapping("/me")
    public ResponseEntity<UserShortDTO> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        User user = authenticationService.provisionUserIfMissing(jwt);

        if (user == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(new UserShortDTO(user));
    }

    /**
     * Allows the currently authenticated user to update their first and last name.
     * Names are stored in the local database and are independent from Keycloak.
     *
     * @param jwt               of the authenticated user
     * @param updateUserNameDTO contains the new first and last name
     * @return 204 No Content if updated successfully
     */
    @Authenticated
    @PutMapping("/name")
    public ResponseEntity<Void> updateUserName(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateUserNameDTO updateUserNameDTO) {
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
    @Authenticated
    @PutMapping("/password")
    public ResponseEntity<Void> updatePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdatePasswordDTO dto) {
        boolean updated = keycloakUserService.setPassword(jwt.getSubject(), dto.newPassword());
        return updated ? ResponseEntity.noContent().build() : ResponseEntity.badRequest().build();
    }

    /**
     * Retrieves a paginated list of users who are TUM-affiliated and not currently assigned to any research group.
     *
     * @param pageDTO     pagination parameters
     * @param searchQuery optional search query to filter users by name or email
     * @return paginated list of available users as {@link KeycloakUserDTO}
     */
    @ProfessorOrEmployeeOrAdmin
    @GetMapping("/available-for-research-group")
    public ResponseEntity<PageResponseDTO<KeycloakUserDTO>> getAvailableUsersForResearchGroup(
        @ParameterObject @Valid @ModelAttribute PageDTO pageDTO,
        @RequestParam(required = false) String searchQuery
    ) {
        log.info("Fetching available users for research group with search query: {}", searchQuery);
        List<KeycloakUserDTO> users = keycloakUserService.getAvailableUsersForResearchGroup(searchQuery, pageDTO);
        long total = keycloakUserService.countAvailableUsersForResearchGroup(searchQuery);
        return ResponseEntity.ok(new PageResponseDTO<KeycloakUserDTO>(users, total));
    }

    public record UpdatePasswordDTO(@NotBlank String newPassword) {}
}
