package de.tum.cit.aet.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class TimeConflictException extends RuntimeException {

    public TimeConflictException(String message) {
        super(message);
    }
}
