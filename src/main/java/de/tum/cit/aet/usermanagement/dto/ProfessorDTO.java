package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

public record ProfessorDTO(String firstName, String lastName, String email, String researchGroupName, String researchGroupWebsite) {
    /**
     * Converts a {@link User} entity to a {@link ProfessorDTO}.
     *
     * @param user the user entity representing a professor
     * @return the corresponding {@link ProfessorDTO}
     * @throws IllegalStateException if the user has no associated research group
     */
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
