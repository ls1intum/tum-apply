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
    String website,
    String linkedinUrl,
    String street,
    String city,
    String postalCode,
    ExtractedCertificateDataDTO education
) {
    public static ExtractedApplicationDataDTO onlyEducationDTO(ExtractedCertificateDataDTO certificateDataDTO) {
        return new ExtractedApplicationDataDTO(null, null, null, null, null, null, null, null, certificateDataDTO);
    }
}
