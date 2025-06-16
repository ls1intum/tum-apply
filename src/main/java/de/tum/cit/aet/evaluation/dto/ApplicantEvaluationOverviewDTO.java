package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.usermanagement.constants.GradingScale;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import jakarta.validation.constraints.NotNull;

public record ApplicantEvaluationOverviewDTO(
    @NotNull UserEvaluationOverviewDTO user,
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
     * @return the ApplicantEvaluationOverviewDTO
     */
    public static ApplicantEvaluationOverviewDTO getFromEntity(Applicant applicant) {
        if (applicant == null) {
            return null;
        }
        return new ApplicantEvaluationOverviewDTO(
            UserEvaluationOverviewDTO.getFromEntity(applicant),
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
