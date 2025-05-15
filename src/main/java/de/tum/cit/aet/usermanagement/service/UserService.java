package de.tum.cit.aet.usermanagement.service;

import de.tum.cit.aet.usermanagement.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
