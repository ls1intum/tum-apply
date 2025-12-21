package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.validation.constraints.NotNull;

public record ApplicantForApplicationDetailDTO(
    @NotNull UserForApplicationDetailDTO user,
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
    public static ApplicantForApplicationDetailDTO getFromEntity(Applicant applicant) {
        if (applicant == null) {
            throw new EntityNotFoundException("Applicant Entity should not be null");
        }
        return new ApplicantForApplicationDetailDTO(
            UserForApplicationDetailDTO.getFromEntity(applicant.getUser()),
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
     * Creates an ApplicantForApplicationDetailDTO from the snapshot fields stored in an Application entity.
     * This ensures the DTO reflects the applicant's data at the time of application creation,
     * not their current profile data.
     *
     * @param application the application containing snapshot data
     * @return the ApplicantForApplicationDetailDTO built from snapshot fields
     */
    public static ApplicantForApplicationDetailDTO getFromApplicationSnapshot(Application application) {
        if (application == null) {
            throw new EntityNotFoundException("Application Entity should not be null");
        }

        // Build UserForApplicationDetailDTO from snapshot fields
        UserForApplicationDetailDTO userDTO = new UserForApplicationDetailDTO(
            application.getApplicant().getUserId(),
            application.getApplicantEmail(),
            application.getApplicant().getUser().getAvatar(), // Avatar not snapshotted, get from current user
            String.format("%s %s", application.getApplicantFirstName(), application.getApplicantLastName()),
            application.getApplicantGender(),
            application.getApplicantNationality(),
            application.getApplicantBirthday(),
            application.getApplicantPhoneNumber(),
            application.getApplicantWebsite(),
            application.getApplicantLinkedinUrl()
        );

        return new ApplicantForApplicationDetailDTO(
            userDTO,
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
