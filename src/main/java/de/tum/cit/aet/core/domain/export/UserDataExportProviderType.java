package de.tum.cit.aet.core.domain.export;

/**
 * Provider categories used by {@link ExportedUserData} to declare ownership of export logic.
 *
 * <p>The values model <b>which export section/provider is responsible for an entity</b>:
 * <ul>
 *   <li>{@link #APPLICANT}: applicant-related data, exported into the {@code applicantData} section</li>
 *   <li>{@link #STAFF}: staff/professor/employee/admin-related data, exported into {@code staffData}</li>
 *   <li>{@link #USER_SETTINGS}: base account/profile/settings data, exported independently of staff/applicant sections</li>
 * </ul>
 *
 * <p>Runtime effect:
 * <ul>
 *   <li>APPLICANT section contribution is only considered if the user has APPLICANT role.</li>
 *   <li>STAFF section contribution is only considered if the user has PROFESSOR/EMPLOYEE/ADMIN role.</li>
 *   <li>USER_SETTINGS is always considered.</li>
 * </ul>
 */
public enum UserDataExportProviderType {
    APPLICANT,
    STAFF,
    USER_SETTINGS,
}
