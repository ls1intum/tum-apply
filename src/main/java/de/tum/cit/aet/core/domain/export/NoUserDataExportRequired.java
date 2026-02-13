package de.tum.cit.aet.core.domain.export;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marker annotation to indicate that a type is excluded from user data export requirements.
 *
 * This annotation should be applied to entity classes or other types that do not need to be
 * included in the user data export functionality. When this annotation is present, the type
 * is exempt from architectural rules that enforce proper annotation for data export handling.
 *
 * @see de.tum.cit.aet.core.domain.export
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface NoUserDataExportRequired {
    String reason();
}
