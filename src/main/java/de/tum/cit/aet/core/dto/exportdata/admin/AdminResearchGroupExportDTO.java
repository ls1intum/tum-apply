package de.tum.cit.aet.core.dto.exportdata.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.usermanagement.constants.ResearchGroupState;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Flat, re-importable representation of a {@link de.tum.cit.aet.usermanagement.domain.ResearchGroup}.
 * Members are referenced by user id together with their role within this group.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AdminResearchGroupExportDTO(
    UUID researchGroupId,
    String name,
    String abbreviation,
    String head,
    String email,
    String website,
    UUID departmentId,
    String departmentName,
    String description,
    String street,
    String postalCode,
    String city,
    String universityId,
    ResearchGroupState state,
    List<AdminMemberRefDTO> members,
    LocalDateTime createdAt,
    LocalDateTime lastModifiedAt
) {}
