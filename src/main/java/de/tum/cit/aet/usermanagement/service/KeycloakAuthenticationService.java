package de.tum.cit.aet.usermanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import de.tum.cit.aet.core.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class KeycloakAuthenticationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${keycloak.auth-server-url}")
    private String keycloakAuthUrl;

    @Value("${keycloak.realm}")
    private String realm;

    @Value("${keycloak.resource}")
    private String clientId;

    @Value("${keycloak.credentials.secret}")
    private String clientSecret;

    public String loginWithCredentials(String email, String password) {
        String tokenUrl = keycloakAuthUrl + "/realms/" + realm + "/protocol/openid-connect/token";

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
