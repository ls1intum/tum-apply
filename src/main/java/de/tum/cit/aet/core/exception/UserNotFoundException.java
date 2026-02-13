package de.tum.cit.aet.core.exception;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class UserNotFoundException extends EntityNotFoundException {

    public UserNotFoundException(String message) {
        super(message);
    }

    public static UserNotFoundException forJobId(UUID jobId) {
        return new UserNotFoundException("User for job with Id '" + jobId + "' does not exist");
    }
}
