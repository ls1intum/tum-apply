package de.tum.cit.aet.usermanagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Request body for admin user creation. Required fields are sent to Keycloak;
 * optional fields are stored only in the local DB.
 */
public record CreateUserDTO(
    @NotBlank String firstName,
    @NotBlank String lastName,
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8) String password,
    String universityId,
    String phoneNumber,
    String gender,
    String nationality,
    LocalDate birthday,
    String website,
    String linkedinUrl,
    String selectedLanguage
) {}
