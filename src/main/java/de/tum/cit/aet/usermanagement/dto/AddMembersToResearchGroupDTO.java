package de.tum.cit.aet.usermanagement.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record AddMembersToResearchGroupDTO(@NotEmpty List<UUID> userIds, UUID researchGroupId) {}
