package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.application.domain.Application;
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

    /**
     * Creates an ApplicantDTO from the snapshot fields stored in an Application entity.
     * This ensures the DTO reflects the applicant's data at the time of application creation,
     * not their current profile data.
     *
     * @param application the application containing snapshot data
     * @return the ApplicantDTO built from snapshot fields
     */
    public static ApplicantDTO getFromApplicationSnapshot(Application application) {
        if (application == null) {
            return null;
        }

        // Build UserDTO from snapshot fields
        UserDTO userDTO = new UserDTO(
            application.getApplicant().getUserId(),
            application.getApplicantEmail(),
            application.getApplicant().getUser().getAvatar(), // Avatar not snapshotted, get from current user
            application.getApplicantFirstName(),
            application.getApplicantLastName(),
            application.getApplicantGender(),
            application.getApplicantNationality(),
            application.getApplicantBirthday(),
            application.getApplicantPhoneNumber(),
            application.getApplicantWebsite(),
            application.getApplicantLinkedinUrl(),
            application.getApplicant().getUser().getSelectedLanguage(), // Language not snapshotted
            null // Research group not relevant for application view
        );

        return new ApplicantDTO(
            userDTO,
            application.getApplicantStreet(),
            application.getApplicantPostalCode(),
            application.getApplicantCity(),
            application.getApplicantCountry(),
            application.getApplicantBachelorDegreeName(),
            application.getApplicantBachelorGradeUpperLimit(),
            application.getApplicantBachelorGradeLowerLimit(),
            application.getApplicantBachelorGrade(),
            application.getApplicantBachelorUniversity(),
            application.getApplicantMasterDegreeName(),
            application.getApplicantMasterGradeUpperLimit(),
            application.getApplicantMasterGradeLowerLimit(),
            application.getApplicantMasterGrade(),
            application.getApplicantMasterUniversity()
        );
    }
}
