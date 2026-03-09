package de.tum.cit.aet.core.retention;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicantRetentionService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final AsyncEmailSender sender;
    private final InternalCommentRepository internalCommentRepository;
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final DocumentRepository documentRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final UserRepository userRepository;

    /**
     * Processes a slice of application IDs for deletion based on the specified cutoff date.
     * If dryRun is true, it logs the actions that would be performed without executing them.
     * Otherwise, it deletes the application and all related data, including reviews, comments,
     * document dictionaries, interviewees, and associated documents.
     *
     * @param applicationIds a slice of UUIDs representing the application IDs to process
     * @param dryRun if true, performs a dry run by logging actions without deleting data;
     *               if false, actually deletes the applications and related data
     * @param cutoff the cutoff LocalDateTime used for determining which applications to process
     */
    @Transactional
    public void processApplications(Slice<UUID> applicationIds, Boolean dryRun, LocalDateTime cutoff) {
        for (UUID applicationId : applicationIds) {
            if (dryRun) {
                log.info("Dry run: would process application with ID {} (cutoff={})", applicationId, cutoff);
                continue;
            }

            Optional<Application> applicationOpt = applicationRepository.findWithDetailsById(applicationId);
            if (applicationOpt.isEmpty()) {
                log.warn("Application with ID {} not found for deletion", applicationId);
                continue;
            }

            Application application = applicationOpt.get();

            log.info("Processing deletion for application with ID {}", applicationId);

            // Collect documents to delete
            List<UUID> documentIdsToDelete = documentDictionaryRepository.findDocumentIdsByApplicationId(application.getApplicationId());

            // Delete related data first (no CASCADE)
            applicationReviewRepository.deleteByApplication(application);
            internalCommentRepository.deleteByApplication(application);
            documentDictionaryRepository.deleteByApplicationIdIn(List.of(application.getApplicationId()));
            intervieweeRepository.deleteByApplicationIdIn(List.of(application.getApplicationId()));

            // Delete associated documents
            for (UUID documentId : documentIdsToDelete) {
                documentRepository.deleteById(documentId);
            }

            applicationRepository.delete(application);

            log.info("Deleted application and related data for application ID {}", applicationId);
        }
    }

    /**
     * Sends a one-time warning email to applicants whose closed application was last modified on the given warning day.
     * <p>
     * The repository query matches only the calendar date of {@code warningCutoff} (time ignored) and filters to closed states,
     * so each eligible applicant is warned exactly on that day. Missing users are logged and skipped.
     * </p>
     *
     * @param warningCutoff the day on which to send warnings (time component is ignored in the query)
     */
    public void warnApplicantOfDataDeletion(LocalDateTime warningCutoff) {
        List<UUID> userIds = applicationRepository.findApplicantsToBeWarnedBeforeDeletion(warningCutoff);
        for (UUID userId : userIds) {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                log.warn("User with ID {} not found for deletion warning", userId);
                continue;
            }

            User user = userOpt.get();

            Email email = Email.builder()
                .to(user)
                .language(Language.fromCode(user.getSelectedLanguage()))
                .emailType(EmailType.APPLICANT_DATA_DELETION_WARNING)
                .build();

            sender.sendAsync(email);
        }
    }
}
