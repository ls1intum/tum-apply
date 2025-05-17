package de.tum.cit.aet.core.util;

import java.util.Optional;
import java.util.function.Supplier;

/**
 * Utility class for handling Optionals with custom exceptions.
 */
public final class OptionalUtils {

    private OptionalUtils() {
        // prevent instantiation
    }

    public static <T, E extends RuntimeException> T getOrThrow(Optional<T> optional, Supplier<E> exceptionSupplier) {
        return optional.orElseThrow(exceptionSupplier);
    }
}
