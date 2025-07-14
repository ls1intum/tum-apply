package de.tum.cit.aet.usermanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import de.tum.cit.aet.core.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class KeycloakAuthenticationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${KEYCLOAK_URL:http://localhost:9080}")
    private String keycloakUrl;

    @Value("${KEYCLOAK_REALM:tumapply}")
    private String realm;

    @Value("${KEYCLOAK_SERVER_CLIENT_ID:server-client}")
    private String clientId;

    @Value("${KEYCLOAK_SERVER_CLIENT_SECRET:my-secret}")
    private String clientSecret;

    /**
     * Authenticates a user against the Keycloak server using their email and password.
     *
     * @param email    the email address of the user (used as username)
     * @param password the user's password
     * @return a valid access token as a String if authentication is successful
     * @throws UnauthorizedException if authentication fails or the token response is invalid
     */
    public String loginWithCredentials(String email, String password) {
        String tokenUrl = keycloakUrl + "/realms/" + realm + "/protocol/openid-connect/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "password");
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("username", email);
        map.add("password", password);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(tokenUrl, HttpMethod.POST, request, JsonNode.class);
            JsonNode body = response.getBody();
            if (body == null || body.get("access_token") == null) {
                throw new UnauthorizedException("Token response is invalid");
            }
            return body.get("access_token").asText();
        } catch (Exception e) {
            throw new UnauthorizedException("Invalid username or password", e);
        }
    }
}
