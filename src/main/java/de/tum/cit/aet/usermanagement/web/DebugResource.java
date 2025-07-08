package de.tum.cit.aet.usermanagement.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug")
public class DebugResource {

    @Value("${TEST_SECRET:NOT SET}")
    private String testSecret;

    @GetMapping(value = "/secret", produces = "text/plain")
    public String printSecret() {
        return "TEST_SECRET is: " + testSecret;
    }
}
