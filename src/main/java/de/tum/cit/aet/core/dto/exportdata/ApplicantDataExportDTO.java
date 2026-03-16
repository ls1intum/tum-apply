package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.constants.SubjectArea;
import java.util.List;
import java.util.Set;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApplicantDataExportDTO(
    String street,
    String postalCode,
    String city,
    String country,
    String bachelorDegreeName,
    String bachelorGradeUpperLimit,
    String bachelorGradeLowerLimit,
    String bachelorGrade,
    String bachelorUniversity,
    String masterDegreeName,
    String masterGradeUpperLimit,
    String masterGradeLowerLimit,
    String masterGrade,
    String masterUniversity,
    List<SubjectArea> subjectAreaSubscriptions,
    Set<DocumentExportDTO> documents,
    List<ApplicationExportDTO> applications,
    List<IntervieweeExportDTO> interviewees
) {}
