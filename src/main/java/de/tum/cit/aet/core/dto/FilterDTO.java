package de.tum.cit.aet.core.dto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
public class FilterDTO {

    private Map<String, List<?>> filters = new HashMap<>();

    /**
     * Retrieves the list of filter values associated with the given key.
     *
     * @param key the filter key
     * @return the list of values, or {@code null} if the key is not present
     */
    public List<?> get(String key) {
        return filters.get(key);
    }
}
