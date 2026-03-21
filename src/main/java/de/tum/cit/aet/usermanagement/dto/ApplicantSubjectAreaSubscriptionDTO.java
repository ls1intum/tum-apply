package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.job.constants.SubjectArea;
import jakarta.validation.constraints.NotNull;

public record ApplicantSubjectAreaSubscriptionDTO(@NotNull SubjectArea subjectArea) {
    public static ApplicantSubjectAreaSubscriptionDTO fromSubjectArea(SubjectArea subjectArea) {
        if (subjectArea == null) {
            return null;
        }
        return new ApplicantSubjectAreaSubscriptionDTO(subjectArea);
    }
}
