package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.usermanagement.constants.GradingScale;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.validation.constraints.NotNull;

public record ApplicantForApplicationDetailDTO(
    @NotNull UserForApplicationDetailDTO user,
    String bachelorDegreeName,
    GradingScale bachelorGradingScale,
    String bachelorGrade,
    String bachelorUniversity,
    String masterDegreeName,
    GradingScale masterGradingScale,
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
