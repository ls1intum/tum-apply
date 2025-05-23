package de.tum.cit.aet.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String message) {
        super(message);
    }

    public static EntityNotFoundException forId(String entityName, Object id) {
        return new EntityNotFoundException(entityName + " with id '" + id + "' does not exist");
    }
}
