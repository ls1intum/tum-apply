package de.tum.cit.aet.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.domain.User;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DataExportEmailContextDTO(String userFirstName, String userLastName, String downloadLink, long expiresDays) {
    public static DataExportEmailContextDTO fromUser(User user, String downloadLink, long expiresDays) {
        return new DataExportEmailContextDTO(user.getFirstName(), user.getLastName(), downloadLink, expiresDays);
    }
}
