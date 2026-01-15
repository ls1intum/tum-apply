package de.tum.cit.aet.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

/**
 * Context object for research group emails that need both recipient and group data.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResearchGroupEmailContext(User user, ResearchGroup researchGroup) {}
