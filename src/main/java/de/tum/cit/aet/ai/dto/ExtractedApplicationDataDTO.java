package de.tum.cit.aet.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO for AI-extracted applicant data from a PDF document.
 * All fields are nullable — null means the field was not found in the PDF.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ExtractedApplicationDataDTO(
    String firstName,
    String lastName,
    String phoneNumber,
    String gender,
    String nationality,
    String website,
    String linkedinUrl,
    String dateOfBirth,
    String street,
    String city,
    String country,
    String postalCode,
    String bachelorDegreeName,
    String bachelorUniversity,
    String bachelorGrade,
    String masterDegreeName,
    String masterUniversity,
    String masterGrade
) {}
