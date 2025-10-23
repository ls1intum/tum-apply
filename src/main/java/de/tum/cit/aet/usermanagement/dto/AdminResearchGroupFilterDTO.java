package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.dto.AbstractFilterDTO;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DTO for research group filters for admin users.
 * Contains the status that an admin can use to filter research groups.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class AdminResearchGroupFilterDTO implements AbstractFilterDTO {

    private List<ResearchGroupState> status;
    private String searchQuery;

    public AdminResearchGroupFilterDTO() {}

    public AdminResearchGroupFilterDTO(List<ResearchGroupState> status, String searchQuery) {
        this.status = status;
        this.searchQuery = searchQuery;
    }

    public List<ResearchGroupState> getStatus() {
        return status;
    }

    public void setStatus(List<ResearchGroupState> status) {
        this.status = status;
    }

    public String getSearchQuery() {
        return searchQuery;
    }

    public void setSearchQuery(String searchQuery) {
        this.searchQuery = searchQuery;
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
