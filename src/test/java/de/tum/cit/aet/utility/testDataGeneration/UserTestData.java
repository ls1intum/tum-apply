package de.tum.cit.aet.utility.testDataGeneration;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.UserRepository;

import java.util.UUID;

/**
 * Test data helpers for User (professor).
 */
public final class UserTestData {
    private UserTestData() {}

    /** Unsaved professor with defaults. */
    public static User newProfessor(ResearchGroup rg) {
        User u = new User();
        u.setUserId(UUID.randomUUID());
        u.setFirstName("Alice");
        u.setLastName("Smith");
        u.setEmail("alice.smith@example.com");
        u.setSelectedLanguage("en");
        u.setResearchGroup(rg);
        attachProfessorRole(u, rg);
        return u;
    }

    /** Unsaved professor; all fields optional (null = keep default). */
    public static User newProfessorAll(
        ResearchGroup researchGroup,
        UUID userId,
        String email,
        String firstName,
        String lastName,
        String selectedLanguage,
        String phoneNumber,
        String website,
        String linkedinUrl,
        String nationality,
        String avatar,
        String gender
    ) {
        User u = newProfessor(researchGroup);
        if (userId != null) u.setUserId(userId);
        if (email != null) u.setEmail(email);
        if (firstName != null) u.setFirstName(firstName);
        if (lastName != null) u.setLastName(lastName);
        if (selectedLanguage != null) u.setSelectedLanguage(selectedLanguage);
        if (phoneNumber != null) u.setPhoneNumber(phoneNumber);
        if (website != null) u.setWebsite(website);
        if (linkedinUrl != null) u.setLinkedinUrl(linkedinUrl);
        if (nationality != null) u.setNationality(nationality);
        if (avatar != null) u.setAvatar(avatar);
        if (gender != null) u.setGender(gender);
        return u;
    }

    // --- Saved variants -------------------------------------------------------------------------
    public static User savedProfessor(UserRepository repo, ResearchGroup rg) {
        return repo.save(newProfessor(rg));
    }

    public static User savedProfessorAll(
        UserRepository repo,
        ResearchGroup researchGroup,
        UUID userId,
        String email,
        String firstName,
        String lastName,
        String selectedLanguage,
        String phoneNumber,
        String website,
        String linkedinUrl,
        String nationality,
        String avatar,
        String gender
    ) {
        return repo.save(newProfessorAll(researchGroup, userId, email, firstName, lastName,
            selectedLanguage, phoneNumber, website, linkedinUrl, nationality, avatar, gender));
    }

    private static void attachProfessorRole(User user, ResearchGroup rg) {
        UserResearchGroupRole link = new UserResearchGroupRole();
        link.setUser(user);
        link.setResearchGroup(rg);
        link.setRole(UserRole.PROFESSOR);

        user.getResearchGroupRoles().add(link);
        rg.getUserRoles().add(link);
    }
}
