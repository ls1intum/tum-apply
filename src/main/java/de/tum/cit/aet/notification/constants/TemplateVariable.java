package de.tum.cit.aet.notification.constants;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum TemplateVariable {
    APPLICANT_FIRST_NAME("APPLICANT_FIRST_NAME"),
    APPLICANT_LAST_NAME("APPLICANT_LAST_NAME"),
    APPLICANT_GENDER("APPLICANT_GENDER"),
    USER_FIRST_NAME("USER_FIRST_NAME"),
    USER_LAST_NAME("USER_LAST_NAME"),
    SUPERVISING_PROFESSOR_FIRST_NAME("SUPERVISING_PROFESSOR_FIRST_NAME"),
    SUPERVISING_PROFESSOR_LAST_NAME("SUPERVISING_PROFESSOR_LAST_NAME"),
    SUPERVISING_PROFESSOR_EMAIL("SUPERVISING_PROFESSOR_EMAIL"),
    JOB_TITLE("JOB_TITLE"),
    RESEARCH_GROUP_NAME("RESEARCH_GROUP_NAME"),
    INTERVIEW_DATE("INTERVIEW_DATE"),
    INTERVIEW_START_TIME("INTERVIEW_START_TIME"),
    INTERVIEW_END_TIME("INTERVIEW_END_TIME"),
    INTERVIEW_LOCATION("INTERVIEW_LOCATION"),
    INTERVIEW_STREAM_LINK("INTERVIEW_STREAM_LINK"),
    BOOKING_LINK("BOOKING_LINK"),
    DOWNLOAD_LINK("DOWNLOAD_LINK"),
    EXPORT_EXPIRES_DAYS("EXPORT_EXPIRES_DAYS");

    private final String value;

    public static Set<String> getTemplateVariables() {
        return Arrays.stream(TemplateVariable.values()).map(TemplateVariable::getValue).collect(Collectors.toSet());
    }
}
