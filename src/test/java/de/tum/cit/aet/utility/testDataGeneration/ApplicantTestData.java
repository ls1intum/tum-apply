package de.tum.cit.aet.utility.testDataGeneration;

import de.tum.cit.aet.usermanagement.constants.GradingScale;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;

/**
 * Test data helpers for Applicant.
 */
public final class ApplicantTestData {
    private ApplicantTestData() {}

    /** Creates an unsaved Applicant with sensible defaults. */
    public static Applicant newApplicant(User user) {
        Applicant a = new Applicant();
        a.setUser(user);
        a.setStreet("Teststr. 1");
        a.setPostalCode("12345");
        a.setCity("Munich");
        a.setCountry("Germany");
        a.setBachelorDegreeName("B.Sc. Computer Science");
        a.setBachelorGradingScale(GradingScale.ONE_TO_FOUR);
        a.setBachelorGrade("1.7");
        a.setBachelorUniversity("TUM");
        a.setMasterDegreeName("M.Sc. Informatics");
        a.setMasterGradingScale(GradingScale.ONE_TO_FOUR);
        a.setMasterGrade("1.3");
        a.setMasterUniversity("TUM");
        return a;
    }

    /** Unsaved Applicant with override options (null = keep default). */
    public static Applicant newApplicantAll(
        User user,
        String street,
        String postalCode,
        String city,
        String country,
        String bachelorDegreeName,
        GradingScale bachelorScale,
        String bachelorGrade,
        String bachelorUniversity,
        String masterDegreeName,
        GradingScale masterScale,
        String masterGrade,
        String masterUniversity
    ) {
        Applicant a = newApplicant(user);
        if (street != null) a.setStreet(street);
        if (postalCode != null) a.setPostalCode(postalCode);
        if (city != null) a.setCity(city);
        if (country != null) a.setCountry(country);
        if (bachelorDegreeName != null) a.setBachelorDegreeName(bachelorDegreeName);
        if (bachelorScale != null) a.setBachelorGradingScale(bachelorScale);
        if (bachelorGrade != null) a.setBachelorGrade(bachelorGrade);
        if (bachelorUniversity != null) a.setBachelorUniversity(bachelorUniversity);
        if (masterDegreeName != null) a.setMasterDegreeName(masterDegreeName);
        if (masterScale != null) a.setMasterGradingScale(masterScale);
        if (masterGrade != null) a.setMasterGrade(masterGrade);
        if (masterUniversity != null) a.setMasterUniversity(masterUniversity);
        return a;
    }

    // --- Saved variants -------------------------------------------------------------------------

    public static Applicant saved(ApplicantRepository repo, User user) {
        return repo.save(newApplicant(user));
    }

    public static Applicant savedAll(
        ApplicantRepository repo,
        User user,
        String street,
        String postalCode,
        String city,
        String country,
        String bachelorDegreeName,
        GradingScale bachelorScale,
        String bachelorGrade,
        String bachelorUniversity,
        String masterDegreeName,
        GradingScale masterScale,
        String masterGrade,
        String masterUniversity
    ) {
        return repo.save(newApplicantAll(user, street, postalCode, city, country,
            bachelorDegreeName, bachelorScale, bachelorGrade, bachelorUniversity,
            masterDegreeName, masterScale, masterGrade, masterUniversity));
    }
}
