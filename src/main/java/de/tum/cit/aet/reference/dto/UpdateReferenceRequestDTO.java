package de.tum.cit.aet.reference.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload an applicant submits to update an existing referee contact on their application.
 * Changing the email re-issues the invitation to the new address once the application has
 * already been submitted.
 *
 * @param title     optional academic title or salutation (e.g. {@code Prof. Dr.})
 * @param firstName referee's first name
 * @param lastName  referee's last name
 * @param email     referee's business email address
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UpdateReferenceRequestDTO(
    @Size(max = 32) String title,
    @NotBlank @Size(max = 255) String firstName,
    @NotBlank @Size(max = 255) String lastName,
    @NotBlank @Email @Size(max = 320) String email
) {}
