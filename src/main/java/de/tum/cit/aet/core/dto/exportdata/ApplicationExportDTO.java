package de.tum.cit.aet.core.dto.exportdata;

import de.tum.cit.aet.application.constants.ApplicationState;
import java.time.LocalDate;

public record ApplicationExportDTO(String jobTitle, ApplicationState state, LocalDate desiredStartDate) {}
