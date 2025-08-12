package de.tum.cit.aet.utility;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.repository.ResearchGroupRepository;

public final class ResearchGroupTestData {
    private ResearchGroupTestData() {}

    public static ResearchGroup rg() {
        ResearchGroup rg = new ResearchGroup();
        rg.setHead("Alice");
        rg.setName("Test Group");
        rg.setAbbreviation("TG");
        rg.setCity("Testville");
        rg.setDefaultFieldOfStudies("CS");
        rg.setDescription("A test research group");
        rg.setEmail("tg@example.com");
        rg.setPostalCode("12345");
        rg.setSchool("Test University");
        rg.setStreet("123 Main St");
        rg.setWebsite("http://example.com");
        return rg;
    }

    public static ResearchGroup saved(ResearchGroupRepository repo) {
        return repo.save(rg());
    }
}
