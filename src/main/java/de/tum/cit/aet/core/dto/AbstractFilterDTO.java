package de.tum.cit.aet.core.dto;

import java.util.List;
import java.util.Map;

public interface AbstractFilterDTO {
    Map<String, List<?>> getFilters();
}
