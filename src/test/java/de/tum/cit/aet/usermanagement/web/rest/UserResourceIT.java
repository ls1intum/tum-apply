package de.tum.cit.aet.usermanagement.web.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.tum.cit.aet.IntegrationTest;
import de.tum.cit.aet.TestSecurityConfiguration;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestSecurityConfiguration.class)
@AutoConfigureMockMvc
@IntegrationTest
class UserResourceIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Test
    void getCurrentUser_whenAuthenticatedAndNotExists_createsUserAndReturnsData() throws Exception {
        String email = "authenticated@example.com";

        mockMvc
            .perform(get("/api/users/me").header("Authorization", "Bearer dummy-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email.toLowerCase()));

        boolean exists = userRepository.existsByEmailIgnoreCase(email);
        assertThat(exists).isTrue();
    }

    @Test
    void getCurrentUser_whenUnauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }
}
