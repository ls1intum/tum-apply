package de.tum.cit.aet.core.security;

import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.service.UserService;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

/**
 * Converts a JWT into an authenticated Spring Security user with authorities based on the database roles.
 */
@Component
public class CustomJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserService userService;

    public CustomJwtAuthenticationConverter(UserService userService) {
        this.userService = userService;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        String firstName = jwt.getClaimAsString("given_name");
        String lastName = jwt.getClaimAsString("family_name");

        // Create user if missing and fetch database entity
        User user = userService.provisionUserIfMissing(preferredUsername, firstName, lastName);

        // Load all role names from the DB (e.g., ["ADMIN", "PROFESSOR"])
        List<String> roles = userService.getRolesForUser(user);

        Collection<GrantedAuthority> authorities = roles
            .stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
            .collect(Collectors.toList());

        return new JwtAuthenticationToken(jwt, authorities, preferredUsername);
    }
}
