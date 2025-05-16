package de.tum.cit.aet.usermanagement.web.rest;

import static org.assertj.core.api.Assertions.assertThat;

import de.tum.cit.aet.IntegrationTest;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.UserShortDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.util.TestUserFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@IntegrationTest
class UserResourceIT {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Test
    void getCurrentUser_whenAuthenticatedAndExists_returnsUserData() {
        String email = "authenticated@example.com";
        User user = TestUserFactory.create(email, UserRole.APPLICANT);
        userRepository.saveAndFlush(user);

        ResponseEntity<UserShortDTO> response = restTemplate.withBasicAuth(email, "test").getForEntity("/api/users/me", UserShortDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getEmail()).isEqualTo(email);
    }

    @Test
    void getCurrentUser_whenAuthenticatedAndNotExists_createsUserAndReturnsData() {
        String email = "newuser@example.com";

        ResponseEntity<UserShortDTO> response = restTemplate.withBasicAuth(email, "test").getForEntity("/api/users/me", UserShortDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getEmail()).isEqualTo(email.toLowerCase());

        // verify user was persisted
        boolean exists = userRepository.existsByEmailIgnoreCase(email);
        assertThat(exists).isTrue();
    }

    @Test
    void getCurrentUser_whenUnauthenticated_returnsUnauthorized() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/users/me", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
