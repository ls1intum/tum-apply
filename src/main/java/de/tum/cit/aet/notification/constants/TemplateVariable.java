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
    SUPERVISING_PROFESSOR_FIRST_NAME("SUPERVISING_PROFESSOR_FIRST_NAME"),
    SUPERVISING_PROFESSOR_LAST_NAME("SUPERVISING_PROFESSOR_LAST_NAME"),
    JOB_TITLE("JOB_TITLE"),
    RESEARCH_GROUP_NAME("RESEARCH_GROUP_NAME");

    private final String value;

    public static Set<String> getTemplateVariables() {
        return Arrays.stream(TemplateVariable.values()).map(TemplateVariable::getValue).collect(Collectors.toSet());
    }
}
