package de.tum.cit.aet.core.service.export;

import de.tum.cit.aet.usermanagement.domain.User;

/**
 * Context information shared with export providers.
 */
public record ExportContext(User user, boolean hasApplicantRole, boolean hasStaffRole) {}
