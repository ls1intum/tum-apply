package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.application.domain.dto.ApplicationForApplicantDTO;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ApplicationEvaluationDetailListDTO {

    private List<ApplicationForApplicantDTO> applications;
    private long totalRecords;
}
