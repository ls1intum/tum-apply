package de.tum.cit.aet.core.retention;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.config.UserRetentionProperties;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.constants.JobState;
import de.tum.cit.aet.job.repository.JobRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserRetentionService {

    private static final int DAYS_BEFORE_DELETION_WARNING = 28;

    private final UserRetentionProperties userRetentionProperties;

    private final UserRepository userRepository;

    private final AsyncEmailSender sender;

    private final ApplicantRepository applicantRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final DocumentRepository documentRepository;
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final EmailSettingRepository emailSettingRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final ImageRepository imageRepository;
    private final InternalCommentRepository internalCommentRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final JobRepository jobRepository;
    private final RatingRepository ratingRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final UserSettingRepository userSettingRepository;

    public enum RetentionCategory {
        SKIP_ADMIN,
        APPLICANT,
        PROFESSOR_OR_EMPLOYEE,
        UNKNOWN,
    }

    /**
     * Processes a list of candidate user IDs for retention handling.
     *
     * @param userIds list of candidate user IDs
     * @param cutoff inactivity cutoff timestamp used for logging
     * @param dryRun whether to only log without applying changes
     */
    @Transactional
    public void processUserIdsList(List<UUID> userIds, LocalDateTime cutoff, boolean dryRun) {
        for (UUID userId : userIds) {
            Optional<User> userOpt = userRepository.findWithResearchGroupRolesByUserId(userId);
            if (userOpt.isEmpty()) {
                log.debug("User retention: candidate userId={} no longer exists (cutoff={})", userId, cutoff);
                continue;
            }

            User user = userOpt.get();
            UUID resolvedUserId = user.getUserId();
            RetentionCategory category = classify(user);

            log.info(
                "User retention preview: userId={} category={} rolesCount={} dryRun={} cutoff={}",
                resolvedUserId,
                category,
                user.getResearchGroupRoles() == null ? 0 : user.getResearchGroupRoles().size(),
                dryRun,
                cutoff
            );

            if (category == RetentionCategory.SKIP_ADMIN) {
                // Safety-net; repository query already tries to exclude admins.
                log.warn("User retention preview: userId={} classified as ADMIN - skipping", resolvedUserId);
                continue;
            }

            if (category == RetentionCategory.PROFESSOR_OR_EMPLOYEE) {
                handleProfessorOrEmployee(user, dryRun);
            } else if (category == RetentionCategory.APPLICANT) {
                handleApplicant(user, dryRun);
            } else if (category == RetentionCategory.UNKNOWN) {
                log.info("User retention: processing UNKNOWN userId={}", resolvedUserId);
                log.info("No specific handling for UNKNOWN users.");
                continue;
            }
            handleGeneralData(user, dryRun);
        }
    }

    /**
     * Warns users of impending data deletion by sending a warning email to inactive non-admin users
     * whose data is scheduled for deletion after the specified cutoff date.
     * <p>
     * This method calculates a warning date by adding {@code DAYS_BEFORE_DELETION_WARNING} days to the cutoff.
     * It then retrieves a list of inactive non-admin user IDs eligible for warning based on that date.
     * For each user, it verifies their existence, classifies their retention category, and skips admins.
     * Finally, it constructs and sends an asynchronous warning email to the user.
     * </p>
     *
     * @param cutoff the LocalDateTime representing the cutoff date for data deletion;
     *               users inactive beyond this point (adjusted by warning days) will be warned
     */
    public void warnUserOfDataDeletion(LocalDateTime cutoff) {
        LocalDateTime warningDate = cutoff.plusDays(DAYS_BEFORE_DELETION_WARNING);
        List<UUID> userIds = userRepository.findInactiveNonAdminUserIdsForWarning(warningDate);

        for (UUID userId : userIds) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.error("User retention warning: candidate userId={} no longer exists (cutoff={})", userId, cutoff);
                continue;
            }

            User user = userOpt.get();
            RetentionCategory category = classify(user);

            if (category == RetentionCategory.SKIP_ADMIN) {
                // Safety-net; repository query already tries to exclude admins.
                continue;
            }

            Email email = Email.builder()
                .to(user)
                .language(Language.fromCode(user.getSelectedLanguage()))
                .emailType(EmailType.USER_DATA_DELETION_WARNING)
                .build();

            sender.sendAsync(email);
        }
    }

    // Helper methods for handling different categories

    private RetentionCategory classify(User user) {
        List<UserResearchGroupRole> roles =
            user.getResearchGroupRoles() == null ? List.of() : user.getResearchGroupRoles().stream().toList();

        boolean isAdmin = roles.stream().anyMatch(r -> r.getRole() == UserRole.ADMIN);
        if (isAdmin) {
            return RetentionCategory.SKIP_ADMIN;
        }

        boolean isProfessorOrEmployee = roles.stream().anyMatch(r -> r.getRole() == UserRole.PROFESSOR || r.getRole() == UserRole.EMPLOYEE);
        if (isProfessorOrEmployee) {
            return RetentionCategory.PROFESSOR_OR_EMPLOYEE;
        }

        boolean isApplicant = roles.stream().anyMatch(r -> r.getRole() == UserRole.APPLICANT);
        if (isApplicant) {
            return RetentionCategory.APPLICANT;
        }

        return RetentionCategory.UNKNOWN;
    }

    private void handleApplicant(User user, boolean dryRun) {
        if (dryRun) {
            log.info("User retention (dry-run): would process APPLICANT userId={}", user.getUserId());
            return;
        }
        log.info("User retention: processing APPLICANT userId={}", user.getUserId());

        Set<UUID> documentIdsToDelete = new HashSet<>();

        // 1. Delete applications (and for each application delete application reviews, ratings, interviews (slots, interviewees etc), internal comments and dictionaries)
        List<Application> applications = applicationRepository.findAllByApplicantId(user.getUserId());
        if (!applications.isEmpty()) {
            List<UUID> applicationIds = applications.stream().map(Application::getApplicationId).toList();
            documentIdsToDelete.addAll(documentDictionaryRepository.findDocumentIdsByApplicationIds(applicationIds));

            interviewSlotRepository.deleteByIntervieweeApplicationIdIn(applicationIds);
            intervieweeRepository.deleteByApplicationIdIn(applicationIds);

            applicationReviewRepository.deleteByApplicationIdIn(applicationIds);
            ratingRepository.deleteByApplicationIdIn(applicationIds);
            internalCommentRepository.deleteByApplicationIdIn(applicationIds);

            documentDictionaryRepository.deleteByApplicationIdIn(applicationIds);
            applicationRepository.deleteAllInBatch(applications);
        }

        // 2. Delete applicant-owned profile/custom dictionaries
        UUID userId = user.getUserId();
        documentIdsToDelete.addAll(documentDictionaryRepository.findDocumentIdsByApplicantId(userId));
        documentDictionaryRepository.deleteByApplicantId(userId);

        // 3. Delete documents that became unreferenced after dictionary cleanup
        for (UUID documentId : documentIdsToDelete) {
            if (!documentDictionaryRepository.existsByDocumentDocumentId(documentId)) {
                documentRepository.deleteById(documentId);
            }
        }

        // 4. Delete applicant data
        applicantRepository.deleteById(userId);
    }

    private void handleProfessorOrEmployee(User user, boolean dryRun) {
        if (dryRun) {
            log.info("User retention (dry-run): would process PROFESSOR_OR_EMPLOYEE userId={}", user.getUserId());
            return;
        }
        log.info("User retention: processing PROFESSOR_OR_EMPLOYEE userId={}", user.getUserId());

        UUID deletedUserId = userRetentionProperties.getDeletedUserId();
        if (deletedUserId == null || !userRepository.existsById(deletedUserId)) {
            log.warn("User retention: deletedUserId is not configured or missing; skipping anonymization for userId={}", user.getUserId());
            return;
        }
        User deletedUser = userRepository.getReferenceById(deletedUserId);
        imageRepository.dissociateImagesFromUser(user, deletedUser);
        jobRepository.anonymiseJobByUserId(user, deletedUser, JobState.CLOSED);
        internalCommentRepository.anonymiseByCreatedBy(user, deletedUser);
        emailTemplateRepository.anonymiseByCreatedBy(user, deletedUser);
    }

    private void handleGeneralData(User user, boolean dryRun) {
        if (dryRun) {
            log.info("User retention (dry-run): would process general data for userId={}", user.getUserId());
            return;
        }
        log.info("User retention: processing general data for userId={}", user.getUserId());

        // Common data deletion/anonymization for all users
        emailSettingRepository.deleteByUser(user);
        UUID resolvedUserId = user.getUserId();
        imageRepository.deleteProfileImageByUser(resolvedUserId);
        userSettingRepository.deleteByUser(user);
        userResearchGroupRoleRepository.deleteByUserId(resolvedUserId);
        userRepository.deleteByUserId(resolvedUserId);
    }
}
