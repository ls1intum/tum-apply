package de.tum.cit.aet.evaluation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ApplicationEvaluationListDTO {

    private List<ApplicationEvaluationOverviewDTO> applications;
    private long totalRecords;
}
