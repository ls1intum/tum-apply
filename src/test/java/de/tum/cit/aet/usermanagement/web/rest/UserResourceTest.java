package de.tum.cit.aet.usermanagement.web.rest;

import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(UserResourceTest.TestConfig.class)
class UserResourceTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private AuthenticationService authenticationService;
    @Autowired
    private UserRepository userRepository;

    @Test
    void getCurrentUser_withoutJwt_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getCurrentUser_withJwt_provisionsAndReturnsUser() throws Exception {
        String userId = UUID.randomUUID().toString();
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", userId)
                .build();

        User user = createMinimalUser(UUID.fromString(userId));
        User savedUser = userRepository.save(user);
        when(authenticationService.provisionUserIfMissing(any(Jwt.class))).thenReturn(savedUser);

        mockMvc.perform(get("/api/users/me").with(jwt().jwt(jwt)).contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    /**
     * Helper method to create a User with all required fields set.
     */
    private User createMinimalUser(UUID userId) {
        User user = new User();
        user.setUserId(userId);
        user.setEmail("test@example.com");
        user.setFirstName("First");
        user.setLastName("Last");
        user.setSelectedLanguage("en");
        return user;
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public AuthenticationService authenticationService() {
            return Mockito.mock(AuthenticationService.class);
        }
    }
}
