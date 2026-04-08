package de.tum.cit.aet.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;

/**
 * DTO that holds the context data needed to render job publication notification emails.
 *
 * @param applicantFirstName           the recipient's first name
 * @param applicantLastName            the recipient's last name
 * @param jobId                        the published job's ID
 * @param jobTitle                     the published job's title
 * @param supervisingProfessorFirstName the supervising professor's first name
 * @param supervisingProfessorLastName  the supervising professor's last name
 * @param supervisingProfessorEmail     the supervising professor's email
 * @param researchGroupName            the research group name
 * @param subjectArea                  the localized subject area value
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobPublicationEmailContextDTO(
    String applicantFirstName,
    String applicantLastName,
    UUID jobId,
    String jobTitle,
    String supervisingProfessorFirstName,
    String supervisingProfessorLastName,
    String supervisingProfessorEmail,
    String researchGroupName,
    String subjectArea
) {
    public static JobPublicationEmailContextDTO fromEntities(User user, Job job) {
        return new JobPublicationEmailContextDTO(
            user.getFirstName(),
            user.getLastName(),
            job.getJobId(),
            job.getTitle(),
            job.getSupervisingProfessor().getFirstName(),
            job.getSupervisingProfessor().getLastName(),
            job.getSupervisingProfessor().getEmail(),
            job.getResearchGroup().getName(),
            job.getSubjectArea().correctLanguageValue(user.getSelectedLanguage())
        );
    }
}
