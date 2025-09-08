package de.tum.cit.aet.utility.testDataGeneration;

import de.tum.cit.aet.usermanagement.constants.GradingScale;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;

import java.util.UUID;

public final class ApplicantTestData {

    private ApplicantTestData() {}

    /** Unsaved applicant with default user and academic info. */
    public static Applicant newApplicant() {
        User user = new User();
        user.setUserId(UUID.randomUUID());
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEmail("john.doe@example.com");
        user.setSelectedLanguage("en");

        Applicant applicant = new Applicant();
        applicant.setUserId(user.getUserId());
        applicant.setUser(user);

        applicant.setStreet("Main Street 1");
        applicant.setPostalCode("12345");
        applicant.setCity("Munich");
        applicant.setCountry("Germany");

        applicant.setBachelorDegreeName("BSc Computer Science");
        applicant.setBachelorGradingScale(GradingScale.ONE_TO_FOUR);
        applicant.setBachelorGrade("1.5");
        applicant.setBachelorUniversity("TUM");

        applicant.setMasterDegreeName("MSc AI");
        applicant.setMasterGradingScale(GradingScale.ONE_TO_FOUR);
        applicant.setMasterGrade("1.3");
        applicant.setMasterUniversity("TUM");

        return applicant;
    }

    /** Fully customizable applicant (null = fallback to default). */
    public static Applicant newApplicantAll(
        UUID userId,
        String email,
        String firstName,
        String lastName,
        String selectedLanguage,
        String street,
        String postalCode,
        String city,
        String country,
        String bachelorDegreeName,
        GradingScale bachelorGradingScale,
        String bachelorGrade,
        String bachelorUniversity,
        String masterDegreeName,
        GradingScale masterGradingScale,
        String masterGrade,
        String masterUniversity
    ) {
        Applicant base = newApplicant();
        User user = base.getUser();

        if (userId != null) {
            user.setUserId(userId);
            base.setUserId(userId);
        }
        if (email != null) user.setEmail(email);
        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null) user.setLastName(lastName);
        if (selectedLanguage != null) user.setSelectedLanguage(selectedLanguage);

        if (street != null) base.setStreet(street);
        if (postalCode != null) base.setPostalCode(postalCode);
        if (city != null) base.setCity(city);
        if (country != null) base.setCountry(country);

        if (bachelorDegreeName != null) base.setBachelorDegreeName(bachelorDegreeName);
        if (bachelorGradingScale != null) base.setBachelorGradingScale(bachelorGradingScale);
        if (bachelorGrade != null) base.setBachelorGrade(bachelorGrade);
        if (bachelorUniversity != null) base.setBachelorUniversity(bachelorUniversity);

        if (masterDegreeName != null) base.setMasterDegreeName(masterDegreeName);
        if (masterGradingScale != null) base.setMasterGradingScale(masterGradingScale);
        if (masterGrade != null) base.setMasterGrade(masterGrade);
        if (masterUniversity != null) base.setMasterUniversity(masterUniversity);

        return base;
    }

    // --- Saved variants -------------------------------------------------------------------------

    public static Applicant savedApplicant(UserRepository userRepo, ApplicantRepository applicantRepo) {
        Applicant applicant = newApplicant();
        userRepo.save(applicant.getUser());
        return applicantRepo.save(applicant);
    }

    public static Applicant savedApplicantAll(
        UserRepository userRepo,
        ApplicantRepository applicantRepo,
        UUID userId,
        String email,
        String firstName,
        String lastName,
        String selectedLanguage,
        String street,
        String postalCode,
        String city,
        String country,
        String bachelorDegreeName,
        GradingScale bachelorGradingScale,
        String bachelorGrade,
        String bachelorUniversity,
        String masterDegreeName,
        GradingScale masterGradingScale,
        String masterGrade,
        String masterUniversity
    ) {
        Applicant applicant = newApplicantAll(
            userId, email, firstName, lastName, selectedLanguage,
            street, postalCode, city, country,
            bachelorDegreeName, bachelorGradingScale, bachelorGrade, bachelorUniversity,
            masterDegreeName, masterGradingScale, masterGrade, masterUniversity
        );
        userRepo.save(applicant.getUser());
        return applicantRepo.save(applicant);
    }
}
