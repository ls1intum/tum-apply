package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.core.util.StringUtil;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.dto.auth.OtpCompleteDTO;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Finds a user by email in a case-insensitive manner.
     * Returns an empty Optional on null/blank input or when no user exists.
     *
     * @param email raw email input
     * @return optional user
     */
    public Optional<User> findByEmail(String email) {
        String normalizedEmail = StringUtil.normalize(email, true);
        if (normalizedEmail.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByEmailIgnoreCase(normalizedEmail);
    }

    /**
     * Creates a new local user. If a user with the same email already exists, no action is taken.
     *
     * @param request the OTP completion request containing email and optional profile information
     */
    @Transactional
    public void createUser(OtpCompleteDTO request) {
        String normalizedEmail = StringUtil.normalize(request.email(), true);
        if (findByEmail(normalizedEmail).isEmpty()) {
            User newUser = new User();
            newUser.setEmail(normalizedEmail);
            if (request.profile() != null) {
                newUser.setFirstName(StringUtil.normalize(request.profile().firstName(), false));
                newUser.setLastName(StringUtil.normalize(request.profile().lastName(), false));
            }
            userRepository.save(newUser);
        }
    }
}
