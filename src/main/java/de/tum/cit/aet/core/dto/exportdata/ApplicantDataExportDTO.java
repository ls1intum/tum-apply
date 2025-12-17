package de.tum.cit.aet.core.dto.exportdata;

import java.util.List;
import java.util.Set;

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
    Set<DocumentExportDTO> documents,
    List<ApplicationExportDTO> applications
) {}
