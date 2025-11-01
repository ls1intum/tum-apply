package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import java.util.UUID;

/**
 * Test data helpers for Applicant.
 */
public final class ApplicantTestData {

    private ApplicantTestData() {}

    /** Creates an unsaved Applicant with sensible defaults. */
    public static Applicant newApplicant(User user) {
        attachApplicantRole(user);

        Applicant a = new Applicant();
        a.setUser(user);
        a.setStreet("Teststr. 1");
        a.setPostalCode("12345");
        a.setCity("Munich");
        a.setCountry("Germany");
        a.setBachelorDegreeName("B.Sc. Computer Science");
        a.setBachelorGradeUpperLimit("1.0");
        a.setBachelorGradeLowerLimit("4.0");
        a.setBachelorGrade("1.7");
        a.setBachelorUniversity("TUM");
        a.setMasterDegreeName("M.Sc. Informatics");
        a.setMasterGradeUpperLimit("1.0");
        a.setMasterGradeLowerLimit("4.0");
        a.setMasterGrade("1.3");
        a.setMasterUniversity("TUM");
        return a;
    }

    /** Unsaved Applicant with override options (null = keep default). */
    public static Applicant newApplicantAll(
        User user,
        String bachelorDegreeName,
        String bachelorGradeUpperLimit,
        String bachelorGradeLowerLimit,
        String bachelorGrade,
        String bachelorUniversity,
        String masterDegreeName,
        String masterGradeUpperLimit,
        String masterGradeLowerLimit,
        String masterGrade,
        String masterUniversity
    ) {
        Applicant a = newApplicant(user);
        if (bachelorDegreeName != null) a.setBachelorDegreeName(bachelorDegreeName);
        if (bachelorGradeUpperLimit != null) a.setBachelorGradeUpperLimit(bachelorGradeUpperLimit);
        if (bachelorGradeLowerLimit != null) a.setBachelorGradeLowerLimit(bachelorGradeLowerLimit);
        if (bachelorGrade != null) a.setBachelorGrade(bachelorGrade);
        if (bachelorUniversity != null) a.setBachelorUniversity(bachelorUniversity);
        if (masterDegreeName != null) a.setMasterDegreeName(masterDegreeName);
        if (masterGradeUpperLimit != null) a.setMasterGradeUpperLimit(masterGradeUpperLimit);
        if (masterGradeLowerLimit != null) a.setMasterGradeLowerLimit(masterGradeLowerLimit);
        if (masterGrade != null) a.setMasterGrade(masterGrade);
        if (masterUniversity != null) a.setMasterUniversity(masterUniversity);
        return a;
    }

    private static User newApplicantUser() {
        User applicantUser = new User();
        applicantUser.setUserId(UUID.randomUUID());
        applicantUser.setEmail("ada@example.com");
        applicantUser.setSelectedLanguage(Language.ENGLISH.getCode());
        applicantUser.setFirstName("Ada");
        applicantUser.setLastName("Lovelace");

        attachApplicantRole(applicantUser);

        return applicantUser;
    }

    // --- Saved variants -------------------------------------------------------------------------

    public static Applicant saved(ApplicantRepository repo, User user) {
        return repo.save(newApplicant(user));
    }

    public static Applicant savedWithNewUser(ApplicantRepository repo) {
        return saved(repo, newApplicantUser());
    }

    // --- Attach roles ---------------------------------------------------------------------------

    /**
     * Attaches the APPLICANT role for a given user.
     */
    public static void attachApplicantRole(User user) {
        UserResearchGroupRole link = new UserResearchGroupRole();
        link.setUser(user);
        link.setRole(UserRole.APPLICANT);

        user.getResearchGroupRoles().add(link);
    }
}
