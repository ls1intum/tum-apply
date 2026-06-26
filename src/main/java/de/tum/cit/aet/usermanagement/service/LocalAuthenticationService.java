package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.core.service.AppTokenService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Authenticates applicants with email and a locally stored password hash, replacing the Keycloak password
 * grant for the decommissioned external-login realm. On success it mints app-issued tokens via
 * {@link AppTokenService}. TUM staff continue to authenticate through Keycloak and never use this path.
 */
@Service
public class LocalAuthenticationService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AppTokenService appTokenService;

    public LocalAuthenticationService(UserService userService, PasswordEncoder passwordEncoder, AppTokenService appTokenService) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.appTokenService = appTokenService;
    }

    /**
     * Verifies the given credentials and issues an app session on success.
     *
     * @param email       the user's email
     * @param rawPassword the plaintext password
     * @return app-issued access and refresh tokens
     * @throws UnauthorizedException if the user does not exist, has no local password, or the password is wrong
     */
    public AuthResponseDTO loginWithCredentials(String email, String rawPassword) {
        User user = userService.findByEmail(email).orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
        boolean credentialsValid =
            user.getPasswordHash() != null && rawPassword != null && passwordEncoder.matches(rawPassword, user.getPasswordHash());
        // Require a verified email as well; the message stays generic to avoid revealing which check failed.
        if (!credentialsValid || !user.isEmailVerified()) {
            throw new UnauthorizedException("Invalid username or password");
        }
        return appTokenService.issueFor(user);
    }
}
