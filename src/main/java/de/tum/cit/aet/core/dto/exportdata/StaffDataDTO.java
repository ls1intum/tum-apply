package de.tum.cit.aet.core.dto.exportdata;

import java.util.List;

public record StaffDataDTO(
    List<String> supervisedJobs,
    List<ResearchGroupRoleExportDTO> researchGroupRoles,
    List<ApplicationReviewExportDTO> reviews,
    List<InternalCommentExportDTO> comments,
    List<RatingExportDTO> ratings
) {}
