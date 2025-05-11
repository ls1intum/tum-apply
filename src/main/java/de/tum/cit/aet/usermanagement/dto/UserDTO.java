package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.User;
import java.time.LocalDate;
import java.util.UUID;

public record UserDTO(
    UUID userId,
    // ResearchGroup researchGroup,
    String email,
    String avatar,
    String firstName,
    String lastName,
    String gender,
    String nationality,
    LocalDate birthday,
    String phoneNumber,
    String website,
    String linkedinUrl,
    String selectedLanguage
    // postedJobs Set<JobDTO>
    // Set<UserResearchGroupRoleDTO> researchGroupRoles
) {
    public static UserDTO getFromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new UserDTO(
            user.getUserId(),
            user.getEmail(),
            user.getAvatar(),
            user.getFirstName(),
            user.getLastName(),
            user.getGender(),
            user.getNationality(),
            user.getBirthday(),
            user.getPhoneNumber(),
            user.getWebsite(),
            user.getLinkedinUrl(),
            user.getSelectedLanguage()
        );
    }
}
