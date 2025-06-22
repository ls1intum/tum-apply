package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.core.dto.AbstractFilterDTO;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class EvaluationFilterDTO implements AbstractFilterDTO {

    private List<String> status;

    private List<String> job;

    @Override
    public Map<String, List<?>> getFilters() {
        Map<String, List<?>> filters = new HashMap<>();
        if (status != null) {
            filters.put("state", status);
        }
        if (job != null) {
            filters.put("job.jobId", job);
        }
        return filters;
    }
}
