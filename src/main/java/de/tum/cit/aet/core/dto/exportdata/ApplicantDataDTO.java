package de.tum.cit.aet.core.dto.exportdata;

import de.tum.cit.aet.core.domain.DocumentDictionary;
import java.util.List;
import java.util.Set;

public record ApplicantDataDTO(
    String bachelorDegree,
    String bachelorDegreeName,
    String bachelorGrade,
    String bachelorUniversity,
    String masterDegreeName,
    String masterGrade,
    String masterUniversity,
    Set<DocumentDictionary> documents,
    List<ApplicationExportDTO> applications
) {}
