package de.tum.cit.aet.usermanagement.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/debug")
public class DebugResource {

    @Value("${TEST_SECRET:NOT SET}")
    private String testSecret;

    @GetMapping("/secret")
    public String printSecret() {
        return "TEST_SECRET is: " + testSecret;
    }
}
