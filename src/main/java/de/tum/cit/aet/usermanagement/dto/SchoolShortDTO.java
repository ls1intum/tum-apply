package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.domain.School;
import java.util.UUID;

/**
 * Short DTO for {@link School} without nested departments to avoid circular references.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record SchoolShortDTO(UUID schoolId, String name, String abbreviation) {
    public static SchoolShortDTO fromEntity(School school) {
        if (school == null) {
            return null;
        }
        return new SchoolShortDTO(school.getSchoolId(), school.getName(), school.getAbbreviation());
    }
}
