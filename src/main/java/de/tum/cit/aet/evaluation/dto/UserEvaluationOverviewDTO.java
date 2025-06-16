package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;

/**
 * DTO for {@link User} in the Evaluation Context
 */
public record UserEvaluationOverviewDTO(
    UUID userId,
    String email,
    String avatar,
    String name,
    String gender,
    String nationality,
    String website,
    String linkedinUrl
) {
    /**
     * @param user
     * @return The UserEvaluationOverviewDTO from the user
     */
    public static UserEvaluationOverviewDTO getFromEntity(User user) {
        if (user == null) {
            return null;
        }
        return new UserEvaluationOverviewDTO(
            user.getUserId(),
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
