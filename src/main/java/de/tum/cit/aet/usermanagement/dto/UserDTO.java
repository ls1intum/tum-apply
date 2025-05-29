package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.User;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for {@link User}
 */
public record UserDTO(
    UUID userId,
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
    String selectedLanguage,
    ResearchGroupShortDTO researchGroupShortDTO
) {
    /**
     * @param user
     * @return The userDTO from the user
     */
    public static UserDTO getFromEntity(User user) {
        if (user == null) {
            return null;
        }

        ResearchGroupShortDTO researchGroupShortDTO = null;
        if (user.getResearchGroup() != null) {
            researchGroupShortDTO = new ResearchGroupShortDTO(user.getResearchGroup());
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
            user.getSelectedLanguage(),
            researchGroupShortDTO
        );
    }
}
