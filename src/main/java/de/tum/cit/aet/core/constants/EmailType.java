package de.tum.cit.aet.core.constants;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum EmailType {
    /**
     * When an application was accepted
     * To: Applicant whose application was accepted
     * BCC: Supervising Professor of accepted application
     */
    APPLICATION_ACCEPTED("APPLICATION_ACCEPTED", Set.of(UserRole.APPLICANT, UserRole.PROFESSOR), true, true),

    /**
     * When an application was rejected
     * To: Applicant whose application was rejected
     */
    APPLICATION_REJECTED("APPLICATION_REJECTED", Set.of(UserRole.APPLICANT), true, false),

    /**
     * When a new application was received for a job
     * To: Supervising professor of the job
     */
    APPLICATION_RECEIVED("APPLICATION_RECEIVED", Set.of(UserRole.PROFESSOR), false, false),

    /**
     * Confirmation that application was successfully submitted
     * To: Applicant who sent the application
     */
    APPLICATION_SENT("APPLICATION_SENT", Set.of(UserRole.APPLICANT), true, false),

    /**
     * Confirmation that application was successfully withdrawn
     * To: Applicant who withdrew the application
     */
    APPLICATION_WITHDRAWN("APPLICATION_WITHDRAWN", Set.of(UserRole.APPLICANT), false, false);

    private final String value;

    // The UserRoles that can receive this message
    private final Set<UserRole> roles;

    // If true EmailTemplate of this type is shown in the UI and can be edited
    private final boolean templateEditable;

    // If true multiple EmailTemplate's per ResearchGroup can exist
    private final boolean multipleTemplates;

    public static Set<EmailType> getEditableEmailTypes() {
        return Arrays.stream(values()).filter(EmailType::isTemplateEditable).collect(Collectors.toSet());
    }
}
