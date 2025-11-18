package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.usermanagement.constants.ResearchGroupDepartment;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupRequestDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import java.util.UUID;

/**
 * Test data helpers for ResearchGroup.
 * Keeps entity construction and saving in one place.
 */
public final class ResearchGroupTestData {

    private ResearchGroupTestData() {}

    /**
     * Unsaved ResearchGroup with sane defaults.
     */
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
        rg.setUniversityId(UUID.randomUUID().toString().replace("-", "").substring(0, 7));
        rg.setState(ResearchGroupState.ACTIVE);
        rg.setDepartment(ResearchGroupDepartment.INFORMATICS);
        return rg;
    }

    /**
     * Unsaved ResearchGroup; all fields optional (null = keep default).
     */
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
        String website,
        String state,
        ResearchGroupDepartment department
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
        if (state != null) rg.setState(ResearchGroupState.valueOf(state));
        if (department != null) rg.setDepartment(department);
        if (rg.getUniversityId() == null) {
            rg.setUniversityId(UUID.randomUUID().toString().replace("-", "").substring(0, 7));
        }
        return rg;
    }

    // --- Save to Repository variants
    // -------------------------------------------------------------------------
    public static ResearchGroup saved(ResearchGroupRepository repo) {
        return repo.save(newRg());
    }

    public static ResearchGroup savedAll(
        ResearchGroupRepository repo,
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
        String website,
        String state,
        ResearchGroupDepartment department
    ) {
        return repo.save(
            newRgAll(
                head,
                name,
                abbreviation,
                city,
                defaultFieldOfStudies,
                description,
                email,
                postalCode,
                school,
                street,
                website,
                state,
                department
            )
        );
    }

    // --- DTO creation helpers
    // -------------------------------------------------------------------------

    /**
     * Creates a ResearchGroupRequestDTO with the given research group name and
     * default values for other fields.
     */
    public static ResearchGroupRequestDTO createResearchGroupRequest(String researchGroupName) {
        return new ResearchGroupRequestDTO(
            "Prof.",
            "John",
            "Doe",
            "ab12cde",
            "Prof. New",
            researchGroupName,
            ResearchGroupDepartment.INFORMATICS,
            "NRG",
            "nrg@test.com",
            "https://nrg.com",
            "Computer Science",
            "Description",
            "CS",
            "Main St",
            "12345",
            "City"
        );
    }

    /**
     * Creates a ResearchGroupDTO with all fields.
     */
    public static ResearchGroupDTO createResearchGroupDTO(
        String name,
        String abbreviation,
        String head,
        String email,
        String website,
        String university,
        String description,
        String field,
        String street,
        String postalCode,
        String city,
        ResearchGroupState state
    ) {
        return new ResearchGroupDTO(
            name,
            abbreviation,
            head,
            ResearchGroupDepartment.INFORMATICS,
            email,
            website,
            university,
            description,
            field,
            street,
            postalCode,
            city,
            state
        );
    }
}
