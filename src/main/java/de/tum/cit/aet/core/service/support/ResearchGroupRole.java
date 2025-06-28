package de.tum.cit.aet.core.service.support;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import jakarta.annotation.Nullable;
import java.util.UUID;

public record ResearchGroupRole(UserRole role, @Nullable UUID researchGroupId) {}
