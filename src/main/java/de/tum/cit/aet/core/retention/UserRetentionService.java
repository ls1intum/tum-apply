package de.tum.cit.aet.core.retention;

import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
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

    private final ApplicantRepository applicantRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final DocumentRepository documentRepository;
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final EmailSettingRepository emailSettingRepository;
    private final ImageRepository imageRepository;
    private final InternalCommentRepository internalCommentRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final RatingRepository ratingRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final UserSettingRepository userSettingRepository;

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
            handleApplicant(user, cutoff, dryRun);
            handleProfessorOrEmployee(user, cutoff, dryRun);
            handleUnknown(user, cutoff, dryRun);
        }
    }

    // Helper methods for handling different categories

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

    private void handleApplicant(User user, LocalDateTime cutoff, boolean dryRun) {
        if (dryRun) {
            log.info("User retention (dry-run): would process APPLICANT userId={}", user.getUserId());
            return;
        }
        log.info("User retention: processing APPLICANT userId={}", user.getUserId());

        // 1. Delete applications (and for each application delete application reviews, ratings, interviews (slots, interviewees etc), internal comments and documents)
        applicationRepository
            .findAllByApplicantId(user.getUserId())
            .stream()
            .forEach(application -> {
                interviewSlotRepository.deleteByIntervieweeApplication(application);
                intervieweeRepository.deleteByApplication(application);

                applicationReviewRepository.deleteByApplication(application);
                ratingRepository.deleteByApplication(application);
                internalCommentRepository.deleteByApplication(application);

                documentDictionaryRepository.deleteByApplication(application);
                documentRepository.deleteByUploadedBy(user);
                applicationRepository.delete(application);
            });

        // 2. Delete applicant data
        applicantRepository.deleteById(user.getUserId());

        // 3. Delete common user data (UserSettings, EmailSettings, ProfileImage, UserResearchGroupRoles)
        userSettingRepository.deleteByUser(user);
        emailSettingRepository.deleteByUser(user);
        imageRepository.deleteProfileImageByUser(user.getUserId());
        userResearchGroupRoleRepository.deleteByUser(user);

        // 4. Delete user
        userRepository.delete(user);
    }

    private void handleProfessorOrEmployee(User user, LocalDateTime cutoff, boolean dryRun) {
        if (dryRun) {
            log.info("User retention (dry-run): would process PROFESSOR_OR_EMPLOYEE userId={}", user.getUserId());
            return;
        }
        log.info("User retention: processing PROFESSOR_OR_EMPLOYEE userId={}", user.getUserId());

        // TODO: Implement actual data deletion/anonymization logic for PROFESSOR_OR_EMPLOYEE users here.
    }

    private void handleUnknown(User user, LocalDateTime cutoff, boolean dryRun) {
        if (dryRun) {
            log.info("User retention (dry-run): would process UNKNOWN userId={}", user.getUserId());
            return;
        }
        log.info("User retention: processing UNKNOWN userId={}", user.getUserId());

        // TODO: Implement handling UNKNOWN users here.
    }
}
