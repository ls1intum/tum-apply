package de.tum.cit.aet.core.constants;

/**
 * Identifies which kind of admin bulk export should be produced.
 *
 * <ul>
 *   <li>{@link #JOBS_OPEN} – jobs in state {@code PUBLISHED} whose application deadline
 *       ({@code Job.endDate}) is in the future or {@code null}. Excludes draft and
 *       withdrawn applications.</li>
 *   <li>{@link #JOBS_EXPIRED} – jobs in state {@code PUBLISHED} whose application deadline
 *       ({@code Job.endDate}) is in the past. Excludes draft and withdrawn applications.</li>
 *   <li>{@link #JOBS_CLOSED} – jobs in state {@code CLOSED} or {@code APPLICANT_FOUND}.
 *       Excludes draft and withdrawn applications.</li>
 *   <li>{@link #JOBS_DRAFT} – jobs in state {@code DRAFT}. Any submitted applications
 *       are still included (a job that was previously {@code PUBLISHED} can be
 *       moved back to draft and may carry real applicants with it). Excludes
 *       draft and withdrawn applications like the other per-type exports.</li>
 *   <li>{@link #FULL_ADMIN} – everything: research groups with members, every job
 *       (including drafts) grouped under its owning research group, every
 *       application, and re-importable JSON dumps of all entities.</li>
 *   <li>{@link #USERS_AND_ORGS} – JSON-only snapshot of the people + organisational
 *       structure: schools, departments, research groups, users and the
 *       {@code user_research_group_roles} join table. Intended for re-seeding
 *       the database after a hard reset — contains no jobs, applications,
 *       documents or PDFs.</li>
 * </ul>
 */
public enum AdminExportType {
    JOBS_OPEN,
    JOBS_EXPIRED,
    JOBS_CLOSED,
    JOBS_DRAFT,
    FULL_ADMIN,
    USERS_AND_ORGS,
}
