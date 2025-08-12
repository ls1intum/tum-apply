package de.tum.cit.aet.utility;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;

import java.util.UUID;

public final class UserTestData {
    private UserTestData() {}

    public static User professor(ResearchGroup rg) {
        User u = new User();
        u.setUserId(UUID.randomUUID());
        u.setFirstName("Alice");
        u.setLastName("Smith");
        u.setEmail("alice.smith@example.com");
        u.setSelectedLanguage("en");
        u.setResearchGroup(rg);
        return u;
    }

    public static User savedProfessor(UserRepository repo, ResearchGroup rg) {
        return repo.save(professor(rg));
    }
}
