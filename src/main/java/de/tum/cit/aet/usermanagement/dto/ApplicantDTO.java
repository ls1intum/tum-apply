package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.constants.GradingScale;
import de.tum.cit.aet.usermanagement.domain.Applicant;

public record ApplicantDTO(
    UserDTO user,
    String street,
    String postalCode,
    String city,
    String country,
    String bachelorDegreeName,
    GradingScale bachelorGradingScale,
    String bachelorGrade,
    String bachelorUniversity,
    String masterDegreeName,
    GradingScale masterGradingScale,
    String masterGrade,
    String masterUniversity
) {
    public static ApplicantDTO getFromEntity(Applicant applicant) {
        if (applicant == null) {
            return null;
        }
        return new ApplicantDTO(
            UserDTO.getFromEntity(applicant),
            applicant.getStreet(),
            applicant.getPostalCode(),
            applicant.getCity(),
            applicant.getCountry(),
            applicant.getBachelorDegreeName(),
            applicant.getBachelorGradingScale(),
            applicant.getBachelorGrade(),
            applicant.getBachelorUniversity(),
            applicant.getMasterDegreeName(),
            applicant.getMasterGradingScale(),
            applicant.getMasterGrade(),
            applicant.getMasterUniversity()
        );
    }
}
