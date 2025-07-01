package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

public record ProfessorDTO(String firstName, String lastName, String email, String researchGroupName, String researchGroupWebsite) {
    public static ProfessorDTO fromEntity(User user) {
        ResearchGroup researchGroup = user.getResearchGroup();
        if (researchGroup == null) {
            throw new IllegalStateException("Research group is null");
        }
        return new ProfessorDTO(
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            researchGroup.getName(),
            researchGroup.getWebsite()
        );
    }
}
