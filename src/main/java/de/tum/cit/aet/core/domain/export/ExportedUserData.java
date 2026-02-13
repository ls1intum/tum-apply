package de.tum.cit.aet.core.domain.export;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a class as containing user data that should be exported.
 *
 * This annotation is used to identify entity classes that participate in user data export operations.
 * Classes annotated with {@code @ExportedUserData} must specify the export provider type responsible
 * for handling the export of that entity's data.
 *
 * @see UserDataExportProviderType
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface ExportedUserData {
    UserDataExportProviderType by();
}
