package de.tum.cit.aet.evaluation.dto;

import de.tum.cit.aet.core.dto.AbstractFilterDTO;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EvaluationFilterDTO implements AbstractFilterDTO {

    private List<String> status;

    private List<String> job;

    private String search;

    @Override
    public Map<String, List<?>> getFilters() {
        Map<String, List<?>> filters = new HashMap<>();
        if (status != null) {
            filters.put("state", status);
        }
        if (job != null) {
            filters.put("job.title", job);
        }
        return filters;
    }
}
