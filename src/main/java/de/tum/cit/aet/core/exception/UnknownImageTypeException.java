package de.tum.cit.aet.core.exception;

public class UnknownImageTypeException extends RuntimeException {

    public UnknownImageTypeException(String message) {
        super(message);
    }

    public UnknownImageTypeException(String message, Throwable cause) {
        super(message, cause);
    }
}
