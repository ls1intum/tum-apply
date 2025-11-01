package de.tum.cit.aet.application.constants;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ApplicationState {
    SAVED("SAVED", EnumSet.of(UserRole.APPLICANT)),
    SENT("SENT", EnumSet.of(UserRole.APPLICANT)),
    ACCEPTED("ACCEPTED", EnumSet.of(UserRole.PROFESSOR)),
    IN_REVIEW("IN_REVIEW", EnumSet.of(UserRole.PROFESSOR)),
    REJECTED("REJECTED", EnumSet.of(UserRole.PROFESSOR)),
    WITHDRAWN("WITHDRAWN", EnumSet.of(UserRole.APPLICANT)),
    JOB_CLOSED("JOB_CLOSED", EnumSet.of(UserRole.PROFESSOR)),
    INVITED("INVITED", EnumSet.of(UserRole.PROFESSOR)),
    SCHEDULED("SCHEDULED", EnumSet.of(UserRole.PROFESSOR)),
    COMPLETED("COMPLETED", EnumSet.of(UserRole.PROFESSOR));

    private final String value;
    private final Set<UserRole> UserRoles;

    public static Set<ApplicationState> getPermittedStatesByUserRole(UserRole group) {
        return Arrays.stream(values())
            .filter(status -> status.getUserRoles().contains(group))
            .collect(Collectors.toSet());
    }
}
