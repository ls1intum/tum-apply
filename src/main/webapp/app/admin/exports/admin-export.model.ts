/**
 * Frontend types matching the backend admin export REST contract.
 *
 * NOTE: This is intentionally hand-rolled rather than generated. The
 * AdminExportResource backend endpoint is not part of the OpenAPI generator
 * output yet — when the project's openApiGenerate task is next run, this
 * file can be replaced with the generated equivalent.
 */

/** Matches {@code de.tum.cit.aet.core.constants.AdminExportType}. */
export type AdminExportType = 'JOBS_OPEN' | 'JOBS_EXPIRED' | 'JOBS_CLOSED' | 'FULL_ADMIN';
