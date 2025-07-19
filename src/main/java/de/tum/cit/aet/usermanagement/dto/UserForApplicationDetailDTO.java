package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for {@link User}
 */
public record UserForApplicationDetailDTO(
    @NotNull UUID userId,
    String email,
    String avatar,
    String name,
    String gender,
    String nationality,
    String preferredLanguage,
    LocalDate birthday,
    String phoneNumber,
    String website,
    String linkedinUrl
) {
    /**
     * @param user
     * @return The userDTO from the user
     */
    public static UserForApplicationDetailDTO getFromEntity(User user) {
        if (user == null) {
            throw new EntityNotFoundException("User Entity should not be null");
        }
        return new UserForApplicationDetailDTO(
            user.getUserId(),
            user.getEmail(),
            user.getAvatar(),
            String.format("%s %s", user.getFirstName(), user.getLastName()),
            user.getGender(),
            user.getNationality(),
            user.getSelectedLanguage(),
            user.getBirthday(),
            user.getPhoneNumber(),
            user.getWebsite(),
            user.getLinkedinUrl()
        );
    }
}
