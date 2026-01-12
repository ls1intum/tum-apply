package de.tum.cit.aet.ai.exception;

public class AiResponseException extends RuntimeException {

    public AiResponseException(Throwable cause) {
        super("Failed to parse AI response", cause);
    }
}
