package de.tum.cit.aet.usermanagement.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.core.util.HtmlSanitizer;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import java.util.UUID;

/**
 * Summary DTO for embedding research group data in other DTOs (e.g. JobDetailDTO).
 * Rich-text fields are sanitized on read as defense-in-depth.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ResearchGroupSummaryDTO(
    UUID researchGroupId,
    String name,
    String description,
    String departmentName,
    String email,
    String website,
    String street,
    String postalCode,
    String city
) {
    /**
     * @param researchGroup the research group entity to convert
     * @return the summary DTO, or null if the entity is null
     */
    public static ResearchGroupSummaryDTO getFromEntity(ResearchGroup researchGroup) {
        if (researchGroup == null) {
            return null;
        }
        return new ResearchGroupSummaryDTO(
            researchGroup.getResearchGroupId(),
            researchGroup.getName(),
            HtmlSanitizer.sanitize(researchGroup.getDescription()),
            researchGroup.getDepartment() != null ? researchGroup.getDepartment().getName() : null,
            researchGroup.getEmail(),
            researchGroup.getWebsite(),
            researchGroup.getStreet(),
            researchGroup.getPostalCode(),
            researchGroup.getCity()
        );
    }
}
