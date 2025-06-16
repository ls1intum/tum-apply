package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.usermanagement.domain.User;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for {@link User} in the Evaluation Context
 */
public record UserEvaluationDetailDTO(
    @NotNull String email,
    String avatar,
    @NotNull String name,
    String gender,
    String nationality,
    String website,
    String linkedinUrl
) {
    /**
     * @param user
     * @return The userDTO from the user
     */
    public static UserEvaluationDetailDTO getFromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new UserEvaluationDetailDTO(
            user.getEmail(),
            user.getAvatar(),
            String.format("%s %s", user.getFirstName(), user.getLastName()),
            user.getGender(),
            user.getNationality(),
            user.getWebsite(),
            user.getLinkedinUrl()
        );
    }
}
