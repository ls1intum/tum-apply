package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupDTO;
import de.tum.cit.aet.usermanagement.dto.ResearchGroupMemberDTO;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Re-importable representation of a
 * {@link de.tum.cit.aet.usermanagement.domain.ResearchGroup} for admin bulk
 * exports. Wraps the existing {@link ResearchGroupDTO} (which covers name,
 * head, email, website, description, address and department id) and only
 * adds the id, a denormalized department name, university id, member refs
 * and audit timestamps on top.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminResearchGroupExportDTO(
    UUID researchGroupId,
    ResearchGroupDTO researchGroup,
    String departmentName,
    String universityId,
    List<ResearchGroupMemberDTO> members,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {}
