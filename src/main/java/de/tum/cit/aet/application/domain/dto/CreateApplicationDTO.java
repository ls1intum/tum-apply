package de.tum.cit.aet.application.domain.dto;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import java.time.LocalDate;
import java.util.Set;

public record CreateApplicationDTO(
    ApplicantDTO applicant,
    JobCardDTO job,
    LocalDate desiredDate,
    ApplicationState applicationState,
    String projects,
    String specialSkills,
    String motivation,
    Set<CustomFieldAnswerDTO> answers
) {}
