package de.tum.cit.aet.usermanagement.web.rest;

import de.tum.cit.aet.core.service.AuthenticationService;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.utility.testDataGeneration.ResearchGroupTestData;
import de.tum.cit.aet.utility.testDataGeneration.UserTestData;
import org.junit.jupiter.api.BeforeEach;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(UserResourceTest.TestConfig.class)
class UserResourceTest {

    @Autowired
    UserRepository userRepository;
    @Autowired
    ResearchGroupRepository researchGroupRepository;
    ResearchGroup researchGroup;
    User user;
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private AuthenticationService authenticationService;

    @BeforeEach
    void setup() {
        researchGroupRepository.deleteAll();
        userRepository.deleteAll();

        researchGroup = ResearchGroupTestData.savedAll(
                researchGroupRepository,
                "Algorithms Group", "Prof. Doe", "alg@example.com", "ALG",
                "CS", "We do cool stuff", "alg@example.com",
                "80333", "CIT", "Arcisstr. 21", "https://alg.tum.de"
        );
        user = UserTestData.savedProfessorAll(
                userRepository, researchGroup,
                UUID.randomUUID(), "prof.doe@tum.de", "John", "Doe", "en",
                "+49 89 1234", "https://doe.tum.de", "https://linkedin.com/in/doe",
                "DE", null, "männlich"
        );
    }

    @Test
    void getCurrentUserWithoutJwtReturnsUnauthorized() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/users/me").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andReturn();
        assertThat(result.getResponse().getContentAsString()).isBlank();
        verify(authenticationService, never()).provisionUserIfMissing(any(Jwt.class));
    }

    @Test
    void getCurrentUserWithJwtProvisionsAndReturnsUser() throws Exception {
        Jwt jwt = Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", user.getUserId())
                .build();
        when(authenticationService.provisionUserIfMissing(any(Jwt.class))).thenReturn(user);

        MvcResult result = mockMvc.perform(get("/api/users/me")
                        .with(jwt().jwt(jwt))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(result.getResponse().getContentAsString()).isNotBlank();
        verify(authenticationService).provisionUserIfMissing(any(Jwt.class));
    }

    @TestConfiguration
    static class TestConfig {
        @Bean
        public AuthenticationService authenticationService() {
            return Mockito.mock(AuthenticationService.class);
        }
    }
}
