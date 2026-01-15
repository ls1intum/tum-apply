package de.tum.cit.aet.core.retention;

import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRetentionService {

    private final UserRepository userRepository;

    public enum RetentionCategory {
        SKIP_ADMIN,
        APPLICANT,
        PROFESSOR_OR_EMPLOYEE,
        UNKNOWN,
    }

    @Transactional(readOnly = true)
    public void processUserIdsList(List<UUID> userIds, LocalDateTime cutoff, boolean dryRun) {
        for (UUID userId : userIds) {
            Optional<User> userOpt = userRepository.findWithResearchGroupRolesByUserId(userId);
            if (userOpt.isEmpty()) {
                log.debug("User retention: candidate userId={} no longer exists (cutoff={})", userId, cutoff);
                continue;
            }

            User user = userOpt.get();
            RetentionCategory category = classify(user);

            log.info(
                "User retention preview: userId={} category={} rolesCount={} dryRun={} cutoff={}",
                user.getUserId(),
                category,
                user.getResearchGroupRoles() == null ? 0 : user.getResearchGroupRoles().size(),
                dryRun,
                cutoff
            );

            if (category == RetentionCategory.SKIP_ADMIN) {
                // Safety-net; repository query already tries to exclude admins.
                log.warn("User retention preview: userId={} classified as ADMIN - skipping", user.getUserId());
                continue;
            }

            // Next step: build a concrete RetentionPlan per category and execute it when dryRun=false.
        }
    }

    private RetentionCategory classify(User user) {
        List<UserResearchGroupRole> roles = user.getResearchGroupRoles() == null
            ? List.of()
            : user.getResearchGroupRoles().stream().toList();

        boolean isAdmin = roles.stream().anyMatch(r -> r.getRole() == UserRole.ADMIN);
        if (isAdmin) {
            return RetentionCategory.SKIP_ADMIN;
        }

        boolean isApplicant = roles.stream().anyMatch(r -> r.getRole() == UserRole.APPLICANT);
        if (isApplicant) {
            return RetentionCategory.APPLICANT;
        }

        boolean isProfessorOrEmployee = roles.stream().anyMatch(r -> r.getRole() == UserRole.PROFESSOR || r.getRole() == UserRole.EMPLOYEE);
        if (isProfessorOrEmployee) {
            return RetentionCategory.PROFESSOR_OR_EMPLOYEE;
        }

        return RetentionCategory.UNKNOWN;
    }
}
