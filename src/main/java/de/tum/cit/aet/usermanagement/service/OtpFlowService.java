package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.EmailVerificationFailedException;
import de.tum.cit.aet.core.util.CookieUtils;
import de.tum.cit.aet.usermanagement.constants.OtpPurpose;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import de.tum.cit.aet.usermanagement.dto.auth.AuthSessionInfoDTO;
import de.tum.cit.aet.usermanagement.dto.auth.OtpCompleteDTO;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

/**
 * Service that orchestrates the OTP completion flows, including user login, registration,
 * and application email verification, with integration to Keycloak for user management
 * and authentication token handling.
 */
@Service
public class OtpFlowService {

    private final UserService userService;
    private final KeycloakUserService keycloakUserService;
    private final KeycloakAuthenticationService keycloakAuthService;
    private final EmailVerificationService emailVerificationService;

    public OtpFlowService(UserService userService, KeycloakUserService keycloakUserService,
                          KeycloakAuthenticationService keycloakAuthService, EmailVerificationService emailVerificationService) {
        this.userService = userService;
        this.keycloakUserService = keycloakUserService;
        this.keycloakAuthService = keycloakAuthService;
        this.emailVerificationService = emailVerificationService;
    }

    /**
     * Orchestrates the OTP completion: first verifies the OTP, then executes the requested purpose.
     * This method is the single entry point used by the controller.
     *
     * @param body     the OTP completion request including email, code, purpose and optional profile
     * @param ip       client IP address used for audit and rate limiting
     * @param response the HTTP servlet response to which authentication cookies will be attached
     * @return an {@link AuthSessionInfoDTO} with token lifetimes
     * @throws EmailVerificationFailedException if OTP verification fails or the user cannot be validated
     */
    public AuthSessionInfoDTO otpComplete(OtpCompleteDTO body, String ip, HttpServletResponse response) {
        emailVerificationService.verifyCode(body, ip);

        OtpPurpose purpose = body.purpose();
        return switch (purpose) {
            case LOGIN -> handleLogin(body, response);
            case REGISTER -> handleRegister(body, response);
        };
    }

    /**
     * /**
     * /**
     * Handles the OTP completion flow for user login.
     * <p>
     * Ensures the user exists, marks their email as verified in Keycloak, and returns token lifetimes.
     * Authentication cookies will be attached via Keycloak token exchange.
     * No new user is created; if the user is not found, validation fails and an
     * {@link EmailVerificationFailedException} is thrown.
     *
     * @param body     the OTP completion request
     * @param response the HTTP response to which authentication cookies will be added via Keycloak token exchange
     * @return an {@link AuthSessionInfoDTO} with token lifetimes
     * @throws EmailVerificationFailedException if the user is not found
     */
    private AuthSessionInfoDTO handleLogin(OtpCompleteDTO body, HttpServletResponse response) {
        userService.findByEmail(body.email()).orElseThrow(EmailVerificationFailedException::new);
        String keycloakUserId = keycloakUserService.ensureUser(body);
        return getTokens(keycloakUserId, response);
    }

    /**
     * Handles the OTP completion flow for user registration.
     * <p>
     * Creates a verified user if one does not exist, sets the user's first and last name,
     * ensures the user exists in Keycloak and marks the email as verified.
     * Returns whether the user needs to complete their profile.
     *
     * @param body     the OTP completion request containing optional profile
     * @param response the HTTP response to which authentication cookies may be added
     * @return an {@link AuthSessionInfoDTO} with token lifetimes and a flag indicating if profile completion is needed
     */
    private AuthSessionInfoDTO handleRegister(OtpCompleteDTO body, HttpServletResponse response) {
        String keycloakUserId = keycloakUserService.ensureUser(body);
        String firstName = body.profile() != null ? body.profile().firstName() : null;
        String lastName = body.profile() != null ? body.profile().lastName() : null;
        userService.upsertUser(keycloakUserId, body.email(), firstName, lastName);
        return getTokens(keycloakUserId, response);
    }

    /**
     * Exchanges Keycloak tokens for the given user ID and sets authentication cookies in the response.
     *
     * @param keycloakUserId the Keycloak user ID
     * @param response       the HTTP response to which cookies will be added
     * @return an {@link AuthSessionInfoDTO} with token lifetimes
     */
    private AuthSessionInfoDTO getTokens(String keycloakUserId, HttpServletResponse response) {
        AuthResponseDTO tokens = keycloakAuthService.exchangeForUserTokens(keycloakUserId);
        CookieUtils.setAuthCookies(response, tokens);
        return new AuthSessionInfoDTO(tokens.expiresIn(), tokens.refreshExpiresIn());
    }
}
