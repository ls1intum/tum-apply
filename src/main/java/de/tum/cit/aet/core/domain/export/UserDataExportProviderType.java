package de.tum.cit.aet.core.domain.export;

/**
 * Enum representing the different types of data export providers in the user data export system.
 *
 * <p>Each provider type corresponds to a specific category of user data that can be exported:
 * <ul>
 *   <li>{@link #APPLICANT} - Exports data related to applicants</li>
 *   <li>{@link #STAFF} - Exports data related to staff members</li>
 *   <li>{@link #USER_SETTINGS} - Exports user settings and preferences</li>
 * </ul>
 *
 * @see de.tum.cit.aet.core.domain.export.UserDataExportProvider
 */
public enum UserDataExportProviderType {
    APPLICANT,
    STAFF,
    USER_SETTINGS,
}
