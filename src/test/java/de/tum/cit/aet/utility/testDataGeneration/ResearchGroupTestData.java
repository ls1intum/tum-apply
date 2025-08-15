package de.tum.cit.aet.utility.testDataGeneration;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;

/**
 * Test data helpers for ResearchGroup.
 * Keeps entity construction and saving in one place.
 */
public final class ResearchGroupTestData {
    private ResearchGroupTestData() {}

    /** Unsaved ResearchGroup with sane defaults. */
    public static ResearchGroup newRg() {
        ResearchGroup rg = new ResearchGroup();
        rg.setHead("Alice");
        rg.setName("Test Group");
        rg.setAbbreviation("TG");
        rg.setCity("Testville");
        rg.setDefaultFieldOfStudies("CS");
        rg.setDescription("A test research group");
        rg.setEmail("rg@example.com");
        rg.setPostalCode("12345");
        rg.setSchool("Test University");
        rg.setStreet("123 Main St");
        rg.setWebsite("http://example.com");
        return rg;
    }

    /** Unsaved ResearchGroup; all fields optional (null = keep default). */
    public static ResearchGroup newRgAll(
        String head,
        String name,
        String abbreviation,
        String city,
        String defaultFieldOfStudies,
        String description,
        String email,
        String postalCode,
        String school,
        String street,
        String website
    ) {
        ResearchGroup rg = newRg();
        if (head != null) rg.setHead(head);
        if (name != null) rg.setName(name);
        if (abbreviation != null) rg.setAbbreviation(abbreviation);
        if (city != null) rg.setCity(city);
        if (defaultFieldOfStudies != null) rg.setDefaultFieldOfStudies(defaultFieldOfStudies);
        if (description != null) rg.setDescription(description);
        if (email != null) rg.setEmail(email);
        if (postalCode != null) rg.setPostalCode(postalCode);
        if (school != null) rg.setSchool(school);
        if (street != null) rg.setStreet(street);
        if (website != null) rg.setWebsite(website);
        return rg;
    }

    // --- Save to Repository variants -------------------------------------------------------------------------
    public static ResearchGroup saved(ResearchGroupRepository repo) {
        return repo.save(newRg());
    }

    public static ResearchGroup savedAll(
        ResearchGroupRepository repo,
        String head, String name, String abbreviation, String city,
        String defaultFieldOfStudies, String description, String email,
        String postalCode, String school, String street, String website
    ) {
        return repo.save(newRgAll(head, name, abbreviation, city,
            defaultFieldOfStudies, description, email,
            postalCode, school, street, website));
    }
}
