package de.tum.cit.aet.application.constants;

import de.tum.cit.aet.usermanagement.constants.UserGroup;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ApplicationStatus {
    SAVED("SAVED", EnumSet.of(UserGroup.APPLICANT)),
    SENT("SENT", EnumSet.of(UserGroup.APPLICANT)),
    ACCEPTED("ACCEPTED", EnumSet.of(UserGroup.RESEARCH_ASSISTANT, UserGroup.PROFESSOR)),
    IN_REVIEW("IN_REVIEW", EnumSet.of(UserGroup.RESEARCH_ASSISTANT, UserGroup.PROFESSOR)),
    REJECTED("REJECTED", EnumSet.of(UserGroup.RESEARCH_ASSISTANT, UserGroup.PROFESSOR)),
    WITHDRAWN("WITHDRAWN", EnumSet.of(UserGroup.APPLICANT));

    private final String value;
    private final Set<UserGroup> userGroups;

    public static Set<ApplicationStatus> getByUserGroup(UserGroup group) {
        return Arrays.stream(values()).filter(status -> status.getUserGroups().contains(group)).collect(Collectors.toSet());
    }
}
