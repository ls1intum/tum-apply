package de.tum.cit.aet.util;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import java.util.Set;

public class TestUserFactory {

    public static User create(String email, UserRole role) {
        User user = new User();
        user.setEmail(email.toLowerCase());
        user.setFirstName("Test");
        user.setLastName("User");
        user.setSelectedLanguage("en");

        UserResearchGroupRole userResearchGroupRole = new UserResearchGroupRole();
        userResearchGroupRole.setUser(user);
        userResearchGroupRole.setRole(role);

        user.setResearchGroupRoles(Set.of(userResearchGroupRole));
        return user;
    }
}
