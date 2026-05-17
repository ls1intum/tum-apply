package de.tum.cit.aet.usermanagement.dto;

import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.usermanagement.domain.ResearchGroup;
import de.tum.cit.aet.usermanagement.domain.User;

public record ProfessorDTO(String firstName, String lastName, String email, String researchGroupName, String researchGroupWebsite) {
    /**
     * Converts a {@link User} entity to a {@link ProfessorDTO}.
     *
     * <p>Returns null research-group fields when the user has no research group
     * (e.g. the anonymised "deleted user" sentinel after retention runs). Use
     * {@link #fromJob(Job)} when the job's research group should be used as the
     * authoritative source instead of the supervising professor's.
     *
     * @param user the user entity representing a professor
     * @return the corresponding {@link ProfessorDTO}
     */
    public static ProfessorDTO fromEntity(User user) {
        ResearchGroup researchGroup = user.getResearchGroup();
        return new ProfessorDTO(
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            researchGroup != null ? researchGroup.getName() : null,
            researchGroup != null ? researchGroup.getWebsite() : null
        );
    }

    /**
     * Builds a {@link ProfessorDTO} from a {@link Job}, using the job's research
     * group as the authoritative source.
     *
     * <p>The job retains its research group even after the supervising professor
     * is anonymised, so this is the safe choice for application/evaluation flows
     * where the original research-group context still matters.
     *
     * @param job the job whose supervising professor and research group should be used
     * @return the corresponding {@link ProfessorDTO}
     */
    public static ProfessorDTO fromJob(Job job) {
        User professor = job.getSupervisingProfessor();
        ResearchGroup researchGroup = job.getResearchGroup();
        return new ProfessorDTO(
            professor.getFirstName(),
            professor.getLastName(),
            professor.getEmail(),
            researchGroup != null ? researchGroup.getName() : null,
            researchGroup != null ? researchGroup.getWebsite() : null
        );
    }
}
