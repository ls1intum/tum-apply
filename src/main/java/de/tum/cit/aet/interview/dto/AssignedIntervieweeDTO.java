package de.tum.cit.aet.interview.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.usermanagement.domain.User;
import java.util.UUID;

/**
 * DTO for assigned interviewee information in slot responses.
 * Contains user details and interview state for display purposes.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record AssignedIntervieweeDTO(UUID id, UUID applicationId, String firstName, String lastName, String email, IntervieweeState state) {
    /**
     * Creates an AssignedIntervieweeDTO from an Interviewee entity.
     *
     * @param interviewee the interviewee entity
     * @param state       the calculated interview state
     * @return the DTO representation
     */
    public static AssignedIntervieweeDTO fromEntity(Interviewee interviewee, IntervieweeState state) {
        User user = interviewee.getApplication().getApplicant().getUser();
        return new AssignedIntervieweeDTO(
            interviewee.getId(),
            interviewee.getApplication().getApplicationId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            state
        );
    }
}
