package de.tum.cit.aet.core.exception;

public class NoProfilePictureException extends BadRequestException {

    public NoProfilePictureException() {
        super("No stored profile picture exists for this user");
    }

    public NoProfilePictureException(String message) {
        super(message);
    }
}
