package de.tum.cit.aet.usermanagement.web.rest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import de.tum.cit.aet.TestSecurityConfiguration;
import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.web.UserResource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UserResource.class)
@Import(TestSecurityConfiguration.class)
class UserResourceTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuthenticationService authenticationService; // now a Spring bean

    @MockitoBean
    private UserRepository userRepository;

    /*@Test
    void getCurrentUser_whenAuthenticatedAndNotExists_createsUserAndReturnsData() throws Exception {
        String email = "authenticated@example.com";

        mockMvc
            .perform(get("/api/users/me").header("Authorization", "Bearer dummy-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email.toLowerCase()));

        boolean exists = userRepository.existsByEmailIgnoreCase(email);
        assertThat(exists).isTrue();
    }*/

    @Test
    void getCurrentUser_whenUnauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }
}
