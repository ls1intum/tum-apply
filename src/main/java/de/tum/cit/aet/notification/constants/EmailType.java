package de.tum.cit.aet.notification.constants;

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
    APPLICATION_ACCEPTED("APPLICATION_ACCEPTED", Set.of(UserRole.APPLICANT, UserRole.PROFESSOR, UserRole.EMPLOYEE), true, true),

    /**
     * When an application was rejected
     * To: Applicant whose application was rejected
     */
    APPLICATION_REJECTED("APPLICATION_REJECTED", Set.of(UserRole.APPLICANT), true, false),

    /**
     * When a new application was received for a job
     * To: Supervising professor of the job
     */
    APPLICATION_RECEIVED("APPLICATION_RECEIVED", Set.of(UserRole.PROFESSOR, UserRole.EMPLOYEE), false, false),

    /**
     * Confirmation that application was successfully submitted
     * To: Applicant who sent the application
     */
    APPLICATION_SENT("APPLICATION_SENT", Set.of(UserRole.APPLICANT), true, false),

    /**
     * Confirmation that application was successfully withdrawn
     * To: Applicant who withdrew the application
     */
    APPLICATION_WITHDRAWN("APPLICATION_WITHDRAWN", Set.of(UserRole.APPLICANT), false, false),

    /**
     * Interview invitation when applicant is assigned to an interview slot
     * To: Applicant who was assigned to the slot
     */
    INTERVIEW_INVITATION("INTERVIEW_INVITATION", Set.of(UserRole.APPLICANT), true, false),
    /** When a user is added to a research group
     * To: Newly added member
     */
    RESEARCH_GROUP_MEMBER_ADDED("RESEARCH_GROUP_MEMBER_ADDED", Set.of(UserRole.EMPLOYEE, UserRole.PROFESSOR), true, false),

    /**
     * When a research group request is approved
     * To: Research group owner (professor)
     */
    RESEARCH_GROUP_APPROVED("RESEARCH_GROUP_APPROVED", Set.of(UserRole.PROFESSOR), true, false),
    /**
     * Confirmation when applicant books their own interview slot
     * To: Applicant who booked the slot
     */
    INTERVIEW_BOOKED_APPLICANT("INTERVIEW_BOOKED_APPLICANT", Set.of(UserRole.APPLICANT), false, false),

    /**
     * Notification to professor when applicant books an interview slot
     * To: Supervising professor of the job
     */
    INTERVIEW_BOOKED_PROFESSOR("INTERVIEW_BOOKED_PROFESSOR", Set.of(UserRole.PROFESSOR, UserRole.EMPLOYEE), false, false),

    /**
     * Confirmation to professor when they manually assign a slot to an applicant
     * To: Supervising professor of the job
     */
    INTERVIEW_ASSIGNED_PROFESSOR("INTERVIEW_ASSIGNED_PROFESSOR", Set.of(UserRole.PROFESSOR, UserRole.EMPLOYEE), false, false),

    /**
     * Invitation to self-schedule an interview slot
     * To: Applicant
     */
    INTERVIEW_SELF_SCHEDULING_INVITATION("INTERVIEW_SELF_SCHEDULING_INVITATION", Set.of(UserRole.APPLICANT), true, false),

    /**
     * Data export ready notification
     * To: User who requested the export
     */
    DATA_EXPORT_READY("DATA_EXPORT_READY", Set.of(UserRole.APPLICANT, UserRole.PROFESSOR, UserRole.EMPLOYEE, UserRole.ADMIN), false, false);

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
