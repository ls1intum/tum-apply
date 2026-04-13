package de.tum.cit.aet.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

/**
 * Context object for research group emails that need both recipient and group data.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResearchGroupEmailContextDTO(String userFirstName, String userLastName, String researchGroupName) {
    public static ResearchGroupEmailContextDTO fromEntities(User user, ResearchGroup researchGroup) {
        return new ResearchGroupEmailContextDTO(user.getFirstName(), user.getLastName(), researchGroup.getName());
    }
}
