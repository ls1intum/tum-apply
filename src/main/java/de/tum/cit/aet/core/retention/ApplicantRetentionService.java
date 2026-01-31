package de.tum.cit.aet.core.retention;

import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.DocumentDictionary;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicantRetentionService {

    private final ApplicationRepository applicationRepository;

    private final ApplicationReviewRepository applicationReviewRepository;

    private final InternalCommentRepository internalCommentRepository;

    private final DocumentDictionaryRepository documentDictionaryRepository;

    private final DocumentRepository documentRepository;

    private final IntervieweeRepository intervieweeRepository;

    /**
     * Processes a page of application IDs for deletion based on the specified cutoff date.
     * If dryRun is true, it logs the actions that would be performed without executing them.
     * Otherwise, it deletes the application and all related data, including reviews, comments,
     * document dictionaries, interviewees, and associated documents.
     *
     * @param applicationIds a page of UUIDs representing the application IDs to process
     * @param dryRun if true, performs a dry run by logging actions without deleting data;
     *               if false, actually deletes the applications and related data
     * @param cutoff the cutoff LocalDateTime used for determining which applications to process
     */
    @Transactional
    public void processApplications(Page<UUID> applicationIds, Boolean dryRun, LocalDateTime cutoff) {
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
            List<Document> documentsToDelete = documentDictionaryRepository
                .findAllByApplicationApplicationId(application.getApplicationId())
                .stream()
                .map(DocumentDictionary::getDocument)
                .collect(Collectors.toList());

            // Delete related data first (no CASCADE)
            applicationReviewRepository.deleteByApplication(application);
            internalCommentRepository.deleteByApplication(application);
            documentDictionaryRepository.deleteByApplicationIdIn(List.of(application.getApplicationId()));
            intervieweeRepository.deleteByApplicationIdIn(List.of(application.getApplicationId()));

            // Delete associated documents
            for (Document document : documentsToDelete) {
                documentRepository.delete(document);
            }

            applicationRepository.delete(application);

            log.info("Deleted application and related data for application ID {}", applicationId);
        }
    }
}
