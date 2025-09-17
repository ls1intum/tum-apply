package de.tum.cit.aet.core.exception;

public class EmailVerificationFailedException extends RuntimeException {

    public EmailVerificationFailedException() {
        super("Validation failed");
    }

    public EmailVerificationFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}
