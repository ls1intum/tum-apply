package de.tum.cit.aet.usermanagement.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request DTO for a login attempt using email and password.
 *
 * @param email    the email address of the user, must be a valid format and not blank
 * @param password the password of the user, must not be blank
 */
public record LoginRequestDTO(
    @Email(message = "Invalid email format") @NotBlank(message = "Email is required") String email,
    @NotBlank(message = "Password is required") String password
) {
}
