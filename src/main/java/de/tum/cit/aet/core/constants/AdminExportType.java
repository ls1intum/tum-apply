package de.tum.cit.aet.core.constants;

/**
 * Identifies which kind of admin bulk export should be produced.
 *
 * <ul>
 *   <li>{@link #JOBS_OPEN} – jobs in state {@code PUBLISHED} whose application deadline
 *       ({@code Job.endDate}) is in the future or {@code null}. Excludes draft applications.</li>
 *   <li>{@link #JOBS_EXPIRED} – jobs in state {@code PUBLISHED} whose application deadline
 *       ({@code Job.endDate}) is in the past. Includes applications in any state.</li>
 *   <li>{@link #JOBS_CLOSED} – jobs in state {@code CLOSED} or {@code APPLICANT_FOUND}.
 *       Includes applications in any state.</li>
 *   <li>{@link #FULL_ADMIN} – everything: research groups with members, every job
 *       (including drafts) grouped under its owning research group, every
 *       application, and re-importable JSON dumps of all entities.</li>
 * </ul>
 */
public enum AdminExportType {
    JOBS_OPEN,
    JOBS_EXPIRED,
    JOBS_CLOSED,
    FULL_ADMIN,
}
