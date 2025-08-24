package de.tum.cit.aet.core.exception;

public class EmailVerificationFailedException extends RuntimeException {

    public EmailVerificationFailedException(String message) {
        super(message);
    }

    public EmailVerificationFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}
