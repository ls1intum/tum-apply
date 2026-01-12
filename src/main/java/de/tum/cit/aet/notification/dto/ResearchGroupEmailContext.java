package de.tum.cit.aet.notification.dto;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

/**
 * Context object for research group emails that need both recipient and group data.
 */
public record ResearchGroupEmailContext(User user, ResearchGroup researchGroup) {}
