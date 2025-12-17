package de.tum.cit.aet.core.dto.exportdata;

import de.tum.cit.aet.application.constants.ApplicationState;
import java.time.LocalDate;
import java.util.List;

public record ApplicationExportDTO(
    String jobTitle,
    ApplicationState state,
    LocalDate desiredStartDate,
    List<CustomFieldAnswerExportDTO> customFieldAnswers,
    List<InterviewSlotExportDTO> interviewSlots
) {}
