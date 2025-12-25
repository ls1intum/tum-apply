package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.dto.AbstractFilterDTO;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DTO for department filters used in admin endpoints.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class AdminDepartmentFilterDTO implements AbstractFilterDTO {

    private List<String> schoolNames;
    private String searchQuery;

    public AdminDepartmentFilterDTO() {}

    public AdminDepartmentFilterDTO(List<String> schoolNames, String searchQuery) {
        this.schoolNames = schoolNames;
        this.searchQuery = searchQuery;
    }

    public List<String> getSchoolNames() {
        return schoolNames;
    }

    public void setSchoolNames(List<String> schoolNames) {
        this.schoolNames = schoolNames;
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
        if (schoolNames != null && !schoolNames.isEmpty()) {
            filters.put("schoolName", schoolNames);
        }
        return filters;
    }
}
