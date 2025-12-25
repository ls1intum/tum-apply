package de.tum.cit.aet.application.domain.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.job.dto.JobCardDTO;
import de.tum.cit.aet.usermanagement.domain.Department;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.dto.ApplicantDTO;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApplicationForApplicantDTO(
    UUID applicationId,
    ApplicantDTO applicant,
    @NotNull JobCardDTO job,
    @NotNull ApplicationState applicationState,
    LocalDate desiredDate,
    String projects,
    String specialSkills,
    String motivation,
    Set<CustomFieldAnswerDTO> customFields
) {
    /**
     * @param application
     * @return
     */
    public static ApplicationForApplicantDTO getFromEntity(Application application) {
        if (application == null) {
            return null;
        }
        Job job = application.getJob();
        ResearchGroup researchGroup = job.getResearchGroup();
        Department department = researchGroup != null ? researchGroup.getDepartment() : null;
        String departmentName = department != null ? department.getName() : "No Department";
        return new ApplicationForApplicantDTO(
            application.getApplicationId(),
            ApplicantDTO.getFromApplicationSnapshot(application),
            new JobCardDTO(
                job.getJobId(),
                job.getTitle(),
                job.getLocation(),
                job.getSupervisingProfessor().getLastName(),
                departmentName,
                application.getApplicationId(),
                application.getState(),
                job.getWorkload(),
                job.getStartDate(),
                job.getEndDate(),
                job.getContractDuration(),
                job.getImage() != null ? job.getImage().getUrl() : null
            ),
            application.getState(),
            application.getDesiredStartDate(),
            application.getProjects(),
            application.getSpecialSkills(),
            application.getMotivation(),
            application.getCustomFieldAnswers().stream().map(CustomFieldAnswerDTO::getFromEntity).collect(Collectors.toSet())
        );
    }
}
