package de.tum.cit.aet.utility.testdata;

import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.AdminResearchGroupFilterDTO;
import de.tum.cit.aet.usermanagement.dto.EmployeeResearchGroupRequestDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupAdminDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupProvisionDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupRequestDTO;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;
import java.time.LocalDateTime;
import java.util.List;
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
        String state
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
        if (rg.getUniversityId() == null) {
            rg.setUniversityId(UUID.randomUUID().toString().replace("-", "").substring(0, 7));
        }
        return rg;
    }

    // --- Save to Repository variants -------------------------------------------------------------------------
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
        String state
    ) {
        return repo.save(
            newRgAll(head, name, abbreviation, city, defaultFieldOfStudies, description, email, postalCode, school, street, website, state)
        );
    }

    // --- DTO creation helpers -------------------------------------------------------------------------

    /**
     * Creates a ResearchGroupRequestDTO with the given research group name and default values for other fields.
     */
    public static ResearchGroupRequestDTO createResearchGroupRequest(String researchGroupName) {
        return createResearchGroupRequest(researchGroupName, "ab12cde");
    }

    /**
     * Creates a ResearchGroupRequestDTO with the given research group name and university ID.
     */
    public static ResearchGroupRequestDTO createResearchGroupRequest(String researchGroupName, String universityId) {
        return new ResearchGroupRequestDTO(
            "Prof.",
            "John",
            "Doe",
            universityId,
            "Prof. New",
            researchGroupName,
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

    /**
     * Creates a ResearchGroupProvisionDTO.
     */
    public static ResearchGroupProvisionDTO createResearchGroupProvisionDTO(String universityId, UUID researchGroupId) {
        return new ResearchGroupProvisionDTO(universityId, researchGroupId);
    }

    /**
     * Creates an EmployeeResearchGroupRequestDTO.
     */
    public static EmployeeResearchGroupRequestDTO createEmployeeResearchGroupRequestDTO(String professorName) {
        return new EmployeeResearchGroupRequestDTO(professorName);
    }

    /**
     * Creates an AdminResearchGroupFilterDTO.
     */
    public static AdminResearchGroupFilterDTO createAdminResearchGroupFilterDTO(List<ResearchGroupState> states, String search) {
        return new AdminResearchGroupFilterDTO(states, search);
    }

    /**
     * Creates a ResearchGroupAdminDTO.
     */
    public static ResearchGroupAdminDTO createResearchGroupAdminDTO(
        UUID id,
        String name,
        String head,
        ResearchGroupState state,
        LocalDateTime creationDate
    ) {
        return new ResearchGroupAdminDTO(id, name, head, state, creationDate);
    }
}
