package de.tum.cit.aet.usermanagement.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import de.tum.cit.aet.core.exception.UnauthorizedException;
import de.tum.cit.aet.core.service.AppTokenService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.auth.AuthResponseDTO;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class LocalAuthenticationServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AppTokenService appTokenService;

    private LocalAuthenticationService service;

    private User user;

    @BeforeEach
    void setUp() {
        service = new LocalAuthenticationService(userService, passwordEncoder, appTokenService);
        user = new User();
        user.setUserId(UUID.randomUUID());
        user.setEmail("applicant@example.org");
        user.setPasswordHash("$2a$hash");
    }

    @Test
    void issuesTokensOnValidCredentials() {
        when(userService.findByEmail("applicant@example.org")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", "$2a$hash")).thenReturn(true);
        AuthResponseDTO tokens = new AuthResponseDTO("access", "refresh", 300, 2_592_000);
        when(appTokenService.issueFor(user)).thenReturn(tokens);

        assertThat(service.loginWithCredentials("applicant@example.org", "secret")).isSameAs(tokens);
    }

    @Test
    void rejectsWrongPassword() {
        when(userService.findByEmail("applicant@example.org")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "$2a$hash")).thenReturn(false);

        assertThatThrownBy(() -> service.loginWithCredentials("applicant@example.org", "wrong")).isInstanceOf(UnauthorizedException.class);
        verify(appTokenService, never()).issueFor(user);
    }

    @Test
    void rejectsUserWithoutLocalPassword() {
        user.setPasswordHash(null);
        when(userService.findByEmail("applicant@example.org")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> service.loginWithCredentials("applicant@example.org", "secret")).isInstanceOf(
            UnauthorizedException.class
        );
    }

    @Test
    void rejectsUnknownUser() {
        lenient().when(userService.findByEmail("ghost@example.org")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loginWithCredentials("ghost@example.org", "secret")).isInstanceOf(UnauthorizedException.class);
        verify(appTokenService, never()).issueFor(user);
    }
}
