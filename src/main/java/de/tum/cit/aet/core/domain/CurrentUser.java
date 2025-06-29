package de.tum.cit.aet.core.domain;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public record CurrentUser(UUID userId, String email, String firstName, String lastName, List<ResearchGroupRole> researchGroupRoles) {
    public boolean isAdmin() {
        return researchGroupRoles.stream().anyMatch(r -> r.role() == UserRole.ADMIN);
    }

    public boolean isProfessor() {
        return researchGroupRoles.stream().anyMatch(r -> r.role() == UserRole.PROFESSOR);
    }

    public Optional<UUID> getResearchGroupIdIfProfessor() {
        return researchGroupRoles
            .stream()
            .filter(r -> r.role() == UserRole.PROFESSOR)
            .map(ResearchGroupRole::researchGroupId)
            .filter(Objects::nonNull)
            .findFirst();
    }
}
