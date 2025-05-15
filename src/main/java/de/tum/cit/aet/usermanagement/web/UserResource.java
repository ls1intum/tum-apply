package de.tum.cit.aet.usermanagement.web;

import de.tum.cit.aet.core.security.SecurityUtils;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserResource {

    private final UserService userService;

    public UserResource(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserShortDTO> getCurrentUser() {
        String email = SecurityUtils.getCurrentUserLogin().orElseThrow();
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(new UserShortDTO(user));
    }
}
