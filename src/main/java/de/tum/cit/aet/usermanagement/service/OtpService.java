package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.exception.EmailVerificationFailedException;
import de.tum.cit.aet.core.util.CookieUtils;
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
public class OtpService {

    private final UserService userService;
    private final KeycloakUserService keycloakUserService;
    private final KeycloakAuthenticationService keycloakAuthService;

    public OtpService(UserService userService, KeycloakUserService keycloakUserService, KeycloakAuthenticationService keycloakAuthService) {
        this.userService = userService;
        this.keycloakUserService = keycloakUserService;
        this.keycloakAuthService = keycloakAuthService;
    }

    /**
     * Handles the OTP completion flow for user login.
     * <p>
     * Ensures the user exists, marks their email as verified in Keycloak, and returns token lifetimes.
     * Authentication cookies will be attached via Keycloak token exchange.
     * No new user is created; if the user is not found, validation fails and an
     * {@link EmailVerificationFailedException} is thrown.
     *
     * @param request  the OTP completion request
     * @param response the HTTP response to which authentication cookies will be added via Keycloak token exchange
     * @return an {@link AuthSessionInfoDTO} with token lifetimes
     * @throws EmailVerificationFailedException if the user is not found
     */
    private AuthSessionInfoDTO handleLogin(OtpCompleteDTO request, HttpServletResponse response) {
        String email = request.email();
        userService.findByEmail(email).orElseThrow(EmailVerificationFailedException::new);
        String keycloakUserId = keycloakUserService.ensureUser(email);
        return getTokens(keycloakUserId, response);
    }

    /**
     * Handles the OTP completion flow for user registration.
     * <p>
     * Creates a verified user if one does not exist, sets the user's first and last name,
     * ensures the user exists in Keycloak and marks the email as verified.
     * Returns whether the user needs to complete their profile.
     *
     * @param request  the OTP completion request containing optional profile
     * @param response the HTTP response to which authentication cookies may be added
     * @return an {@link AuthSessionInfoDTO} with token lifetimes and a flag indicating if profile completion is needed
     */
    private AuthSessionInfoDTO handleRegister(OtpCompleteDTO request, HttpServletResponse response) {
        userService.createUser(request);
        String keycloakUserId = keycloakUserService.ensureUser(request.email());
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
