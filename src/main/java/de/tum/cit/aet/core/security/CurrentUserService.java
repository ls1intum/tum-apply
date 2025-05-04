package de.tum.cit.aet.core.security;

import de.tum.cit.aet.core.repository.UserRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new IllegalStateException("No JWT authentication available");
        }

        UUID userId = UUID.fromString(jwt.getSubject());

        return userRepository.findById(userId).orElseThrow(() -> new IllegalStateException("User not found for ID: " + userId));
    }
}
