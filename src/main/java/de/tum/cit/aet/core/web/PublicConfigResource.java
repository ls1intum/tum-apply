package de.tum.cit.aet.core.web;

import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class PublicConfigResource {

    private final Environment env;

    public PublicConfigResource(Environment env) {
        this.env = env;
    }

    @GetMapping("/config")
    public Map<String, Object> config() {
        Map<String, Object> response = new HashMap<>();

        Map<String, Object> keycloak = new HashMap<>();
        keycloak.put("url", env.getProperty("keycloak.url"));
        keycloak.put("realm", env.getProperty("keycloak.realm"));
        keycloak.put("clientId", env.getProperty("keycloak.client-id"));
        keycloak.put("logging", env.getProperty("keycloak.logging", Boolean.class));
        response.put("keycloak", keycloak);

        Map<String, Object> otp = new HashMap<>();
        otp.put("length", env.getProperty("security.otp.length", Integer.class));
        otp.put("ttlSeconds", env.getProperty("security.otp.ttl-seconds", Integer.class));
        otp.put("resendCooldownSeconds", env.getProperty("security.otp.resend-cooldown-seconds", Integer.class));
        response.put("otp", otp);

        return response;
    }
}
