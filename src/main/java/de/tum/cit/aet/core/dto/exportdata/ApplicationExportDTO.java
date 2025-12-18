package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import java.time.LocalDate;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApplicationExportDTO(
    String jobTitle,
    ApplicationState state,
    LocalDate desiredStartDate,
    String motivation,
    String specialSkills,
    String projects
) {}
