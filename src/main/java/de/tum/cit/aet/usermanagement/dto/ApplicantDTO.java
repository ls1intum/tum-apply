package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.validation.constraints.NotNull;

public record ApplicantDTO(
    @NotNull UserDTO user,
    String street,
    String postalCode,
    String city,
    String country,
    String bachelorDegreeName,
    String bachelorGradeUpperLimit,
    String bachelorGradeLowerLimit,
    String bachelorGrade,
    String bachelorUniversity,
    String masterDegreeName,
    String masterGradeUpperLimit,
    String masterGradeLowerLimit,
    String masterGrade,
    String masterUniversity
) {
    /**
     *
     * @param applicant
     * @return the ApplicantDTO
     */
    public static ApplicantDTO getFromEntity(Applicant applicant) {
        if (applicant == null) {
            return null;
        }
        return new ApplicantDTO(
            UserDTO.getFromEntity(applicant.getUser()),
            applicant.getStreet(),
            applicant.getPostalCode(),
            applicant.getCity(),
            applicant.getCountry(),
            applicant.getBachelorDegreeName(),
            applicant.getBachelorGradeUpperLimit(),
            applicant.getBachelorGradeLowerLimit(),
            applicant.getBachelorGrade(),
            applicant.getBachelorUniversity(),
            applicant.getMasterDegreeName(),
            applicant.getMasterGradeUpperLimit(),
            applicant.getMasterGradeLowerLimit(),
            applicant.getMasterGrade(),
            applicant.getMasterUniversity()
        );
    }
}
