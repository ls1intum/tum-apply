package de.tum.cit.aet.core.dto.exportdata;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApplicantReferenceRequestExportDTO(
    String jobTitle,
    String title,
    String firstName,
    String lastName,
    String email,
    ReferenceRequestStatus status
) {}
