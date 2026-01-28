package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record StaffDataDTO(
    List<String> supervisedJobs,
    List<ResearchGroupRoleExportDTO> researchGroupRoles,
    List<ApplicationReviewExportDTO> reviews,
    List<InternalCommentExportDTO> comments,
    List<RatingExportDTO> ratings,
    List<InterviewProcessExportDTO> interviewProcesses,
    List<InterviewSlotExportDTO> interviewSlots
) {}
