package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.core.dto.AbstractFilterDTO;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AdminResearchGroupFilterDTO implements AbstractFilterDTO {

    private List<ResearchGroupState> status;

    public AdminResearchGroupFilterDTO() {}

    public AdminResearchGroupFilterDTO(List<ResearchGroupState> status) {
        this.status = status;
    }

    public List<ResearchGroupState> getStatus() {
        return status;
    }

    public void setStatus(List<ResearchGroupState> status) {
        this.status = status;
    }

    @Override
    public Map<String, List<?>> getFilters() {
        Map<String, List<?>> filters = new HashMap<>();
        if (status != null && !status.isEmpty()) {
            filters.put("state", status);
        }
        return filters;
    }
}
