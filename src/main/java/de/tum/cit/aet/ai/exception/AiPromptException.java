package de.tum.cit.aet.ai.exception;

public class AiPromptException extends IllegalStateException {
    public AiPromptException(Throwable cause) {
        super("Failed to load AI prompt", cause);
    }
}
