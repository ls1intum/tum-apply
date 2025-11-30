package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.usermanagement.domain.School;
import de.tum.cit.aet.usermanagement.repository.SchoolRepository;

public final class SchoolTestData {

    private SchoolTestData() {}

    /**
     * Unsaved School with sane defaults.
     */
    public static School newSchool() {
        School school = new School();
        school.setName("School of Computation, Information and Technology");
        school.setAbbreviation("CIT");
        return school;
    }

    /**
     * Unsaved School; all fields optional (null = keep default).
     */
    public static School newSchoolAll(String name, String abbreviation) {
        School school = new School();
        school.setName(name != null ? name : "School of Computation, Information and Technology");
        school.setAbbreviation(abbreviation != null ? abbreviation : "CIT");
        return school;
    }

    // --- Save to Repository variants -------------------------------------------------------------------------

    /**
     * Saved School with default name and abbreviation.
     */
    public static School saved(SchoolRepository repo) {
        return repo.save(newSchool());
    }

    /**
     * Saved School with custom name and abbreviation.
     */
    public static School saved(SchoolRepository repo, String name, String abbreviation) {
        return repo.save(newSchoolAll(name, abbreviation));
    }

    /**
     * Saved School with defaults.
     */
    public static School savedDefault(SchoolRepository repo) {
        return saved(repo);
    }
}
