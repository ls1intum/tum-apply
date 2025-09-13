package de.tum.cit.aet.core.service;

import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.service.UserService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {

    private final UserService userService;

    public AuthenticationService(UserService userService) {
        this.userService = userService;
    }

    /**
     * Provisions a user from the JWT claims and assigns the default APPLICANT role if missing.
     * If the user already exists, basic fields are updated. Returns the managed entity.
     *
     * @param jwt The decoded JWT token.
     * @return the existing or newly created {@link User} entity
     */
    @Transactional
    public User provisionUserIfMissing(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        String givenName = jwt.getClaimAsString("given_name");
        String familyName = jwt.getClaimAsString("family_name");
        return userService.upsertUser(jwt.getSubject(), email, givenName, familyName);
    }
}
