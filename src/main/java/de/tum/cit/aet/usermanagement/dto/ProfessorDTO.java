package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.User;

public record ProfessorDTO(String firstName, String lastName, String email, String researchGroupName) {
    public static ProfessorDTO fromEntity(User user) {
        return new ProfessorDTO(user.getFirstName(), user.getLastName(), user.getEmail(), user.getResearchGroup().getName());
    }
}
