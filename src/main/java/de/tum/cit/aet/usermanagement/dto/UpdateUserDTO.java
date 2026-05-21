package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDate;

/**
 * Request body for admin user edits. All fields optional. `email`, `password`,
 * and `userId` are not updatable from this DTO.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record UpdateUserDTO(
    String firstName,
    String lastName,
    String universityId,
    String phoneNumber,
    String gender,
    String nationality,
    LocalDate birthday,
    String website,
    String linkedinUrl,
    String selectedLanguage,
    Boolean aiFeaturesEnabled,
    String avatar
) {}
