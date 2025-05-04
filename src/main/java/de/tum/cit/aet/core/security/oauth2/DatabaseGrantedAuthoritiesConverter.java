package de.tum.cit.aet.core.security.oauth2;

import de.tum.cit.aet.core.repository.UserRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.Collection;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class DatabaseGrantedAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    private final UserRepository userRepository;

    public DatabaseGrantedAuthoritiesConverter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());

        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found for ID: " + userId));

        return user
            .getResearchGroupRoles()
            .stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRole().name()))
            .collect(Collectors.toSet());
    }
}
