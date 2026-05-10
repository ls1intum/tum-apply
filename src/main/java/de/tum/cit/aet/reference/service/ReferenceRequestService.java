package de.tum.cit.aet.reference.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DocumentType;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.documents.domain.ApplicationDocument;
import de.tum.cit.aet.core.documents.service.DocumentService;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.OperationNotAllowedException;
import de.tum.cit.aet.core.service.CurrentUserService;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.dto.ReferenceLetterInvitationContextDTO;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.reference.constants.ReferenceRequestStatus;
import de.tum.cit.aet.reference.domain.ReferenceRequest;
import de.tum.cit.aet.reference.dto.CreateReferenceRequestDTO;
import de.tum.cit.aet.reference.dto.ReferenceLetterContextDTO;
import de.tum.cit.aet.reference.dto.ReferenceRequestDTO;
import de.tum.cit.aet.reference.repository.ReferenceRequestRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Manages the referee contacts an applicant attaches to an application and dispatches the
 * tokenized invitation emails when the application is submitted.
 */
@Service
@RequiredArgsConstructor
public class ReferenceRequestService {

    private static final int TOKEN_BYTE_LENGTH = 32;
    private static final int DEFAULT_VALIDITY_MONTHS = 2;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final DateTimeFormatter DEADLINE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm 'UTC'");

    private final ReferenceRequestRepository referenceRequestRepository;
    private final ApplicationRepository applicationRepository;
    private final CurrentUserService currentUserService;
    private final AsyncEmailSender emailSender;
    private final DocumentService documentService;

    @Value("${aet.client.url:}")
    private String clientUrl;

    /**
     * Lists all referee contacts attached to the given application, ordered by creation time.
     *
     * @param applicationId the owning application
     * @return all reference requests, mapped to DTOs (no token data)
     */
    public List<ReferenceRequestDTO> listForApplication(UUID applicationId) {
        Application application = applicationRepository
            .findByIdWithApplicantAndJob(applicationId)
            .orElseThrow(() -> EntityNotFoundException.forId("Application", applicationId));
        // Read access is wider than write access: the applicant who owns the application,
        // any admin, or staff with access to the job's research group can see the list.
        if (currentUserService.isAdmin() || currentUserService.isCurrentUser(application.getApplicant().getUserId())) {
            // applicant or admin path — allowed
        } else {
            currentUserService.assertAccessTo(application.getJob().getResearchGroup());
        }
        return referenceRequestRepository
            .findByApplicationApplicationIdOrderByCreatedAtAsc(application.getApplicationId())
            .stream()
            .map(ReferenceRequestDTO::fromEntity)
            .toList();
    }

    /**
     * Adds a new referee contact to the application. The application must still be editable
     * (state SAVED) and the job must have reference letters enabled.
     *
     * @param applicationId the owning application
     * @param payload       the referee's title, name and email
     * @return the persisted entry as a DTO
     */
    public ReferenceRequestDTO addToApplication(UUID applicationId, CreateReferenceRequestDTO payload) {
        Application application = assertOwnsApplication(applicationId);
        assertApplicationEditable(application);
        assertReferenceLettersEnabled(application);

        ReferenceRequest entry = new ReferenceRequest();
        entry.setApplication(application);
        entry.setTitle(payload.title());
        entry.setFirstName(payload.firstName().trim());
        entry.setLastName(payload.lastName().trim());
        entry.setEmail(payload.email().trim());
        entry.setStatus(ReferenceRequestStatus.REQUESTED);
        return ReferenceRequestDTO.fromEntity(referenceRequestRepository.save(entry));
    }

    /**
     * Removes a referee contact from the application. Only allowed while the application is
     * still editable; once submitted, removal goes through the withdraw flow (future iteration).
     *
     * @param applicationId  the owning application
     * @param referenceId    the entry to remove
     */
    public void removeFromApplication(UUID applicationId, UUID referenceId) {
        Application application = assertOwnsApplication(applicationId);
        assertApplicationEditable(application);

        ReferenceRequest entry = referenceRequestRepository
            .findByIdWithApplication(referenceId)
            .orElseThrow(() -> EntityNotFoundException.forId("ReferenceRequest", referenceId));
        if (!entry.getApplication().getApplicationId().equals(application.getApplicationId())) {
            throw new OperationNotAllowedException("Reference does not belong to the given application.");
        }
        referenceRequestRepository.delete(entry);
    }

    /**
     * Generates and persists a fresh token for each pending entry on the application and dispatches
     * the invitation email. Must be called from a transactional context — the caller's transaction
     * keeps {@code application.job} / {@code application.job.researchGroup} attached for lazy access.
     *
     * @param application the application whose referees should be notified
     */
    public void dispatchInvitations(Application application) {
        if (application.getJob().getReferenceLettersRequired() <= 0) {
            return;
        }
        List<ReferenceRequest> entries = referenceRequestRepository.findByApplicationApplicationIdOrderByCreatedAtAsc(
            application.getApplicationId()
        );
        for (ReferenceRequest entry : entries) {
            if (entry.getStatus() != ReferenceRequestStatus.REQUESTED || entry.getTokenHash() != null) {
                continue;
            }
            String rawToken = generateToken();
            entry.setTokenHash(hashToken(rawToken));
            entry.setTokenExpiresAt(computeTokenExpiry(application.getJob()));
            referenceRequestRepository.save(entry);
            sendInvitation(application, entry, rawToken);
        }
    }

    /**
     * Resolves a referee invitation token to its prefill context (referee name, applicant name,
     * job title, research group, deadline, status). Returns the context regardless of status so
     * the upload page can render a "thank you" view for already-submitted requests; the upload
     * endpoint enforces the actual write-time guard.
     *
     * @param rawToken the plaintext token from the invitation email
     * @return the context the referee sees on the upload page
     * @throws EntityNotFoundException when the token is unknown
     */
    public ReferenceLetterContextDTO getContextByToken(String rawToken) {
        ReferenceRequest entry = findByRawToken(rawToken);
        Application application = entry.getApplication();
        Job job = application.getJob();
        return new ReferenceLetterContextDTO(
            entry.getTitle(),
            entry.getFirstName(),
            entry.getLastName(),
            application.getApplicantFirstName(),
            application.getApplicantLastName(),
            job.getTitle(),
            job.getResearchGroup() != null ? job.getResearchGroup().getName() : null,
            entry.getTokenExpiresAt(),
            entry.getStatus()
        );
    }

    /**
     * Stores the recommendation letter PDF uploaded by an external referee, links it to the
     * reference request, marks the request {@code SUBMITTED} and — if all required letters are now
     * in — transitions the application from {@code PENDING} back to {@code SENT}.
     *
     * @param rawToken the plaintext token from the invitation email
     * @param file     the uploaded PDF
     * @return the updated request as a DTO
     * @throws EntityNotFoundException      when the token is unknown
     * @throws OperationNotAllowedException when the request is already submitted or the deadline has passed
     */
    @Transactional
    public ReferenceRequestDTO uploadLetter(String rawToken, MultipartFile file) {
        ReferenceRequest entry = findByRawToken(rawToken);
        assertUploadAllowed(entry);

        Application application = entry.getApplication();
        User uploaderForAudit = application.getApplicant().getUser();
        String displayName = "Reference letter — " + entry.getFirstName() + " " + entry.getLastName();

        ApplicationDocument document = documentService.uploadApplicationDocument(
            file,
            DocumentType.REFERENCE_LETTER,
            displayName,
            application,
            uploaderForAudit
        );

        entry.setDocumentId(document.getDocumentId());
        entry.setStatus(ReferenceRequestStatus.SUBMITTED);
        ReferenceRequest saved = referenceRequestRepository.save(entry);

        promoteApplicationToSentIfComplete(application);

        return ReferenceRequestDTO.fromEntity(saved);
    }

    /**
     * Returns true when the application has any unsubmitted reference requests required by the job.
     * Used at submit time to decide between {@code SENT} and {@code PENDING}.
     *
     * @param application the application being submitted
     * @return true when at least one required letter is still missing
     */
    public boolean hasIncompleteReferences(Application application) {
        int required = application.getJob().getReferenceLettersRequired();
        if (required <= 0) {
            return false;
        }
        long submitted = referenceRequestRepository.countByApplicationApplicationIdAndStatus(
            application.getApplicationId(),
            ReferenceRequestStatus.SUBMITTED
        );
        return submitted < required;
    }

    /**
     * Resolves a raw token to its persisted request. Caller is responsible for any lifecycle checks.
     *
     * @param rawToken the plaintext token from the invitation email
     * @return the matching reference request
     * @throws EntityNotFoundException when no request matches the token
     */
    private ReferenceRequest findByRawToken(String rawToken) {
        return referenceRequestRepository
            .findByTokenHashWithApplication(hashToken(rawToken))
            .orElseThrow(() -> new EntityNotFoundException("ReferenceRequest"));
    }

    /**
     * Guards the upload write path: only {@code REQUESTED} requests with a non-expired token may
     * accept a new file. Already-submitted or expired requests are immutable in this iteration.
     *
     * @param entry the reference request being uploaded against
     */
    private void assertUploadAllowed(ReferenceRequest entry) {
        if (entry.getStatus() != ReferenceRequestStatus.REQUESTED) {
            throw new OperationNotAllowedException("This reference letter upload link is no longer accepting files.");
        }
        if (entry.getTokenExpiresAt() != null && entry.getTokenExpiresAt().isBefore(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new OperationNotAllowedException("This reference letter upload link has expired.");
        }
    }

    /**
     * Transitions the owning application from {@code PENDING} to {@code SENT} once the
     * number of submitted letters meets the job's requirement. Triggers no additional emails —
     * the professor was already notified at submit time.
     *
     * @param application the application that just received another submitted letter
     */
    private void promoteApplicationToSentIfComplete(Application application) {
        if (application.getState() != ApplicationState.PENDING) {
            return;
        }
        int required = application.getJob().getReferenceLettersRequired();
        long submitted = referenceRequestRepository.countByApplicationApplicationIdAndStatus(
            application.getApplicationId(),
            ReferenceRequestStatus.SUBMITTED
        );
        if (submitted >= required) {
            application.setState(ApplicationState.SENT);
            applicationRepository.save(application);
        }
    }

    /**
     * Loads the application and verifies the current user owns it (or is an admin).
     *
     * @param applicationId the application to load
     * @return the loaded application with eager applicant + job
     */
    private Application assertOwnsApplication(UUID applicationId) {
        Application application = applicationRepository
            .findByIdWithApplicantAndJob(applicationId)
            .orElseThrow(() -> EntityNotFoundException.forId("Application", applicationId));
        currentUserService.assertAccessTo(application);
        return application;
    }

    private void assertApplicationEditable(Application application) {
        if (!ApplicationState.SAVED.equals(application.getState())) {
            throw new OperationNotAllowedException("References can only be modified while the application is in SAVED state.");
        }
    }

    private void assertReferenceLettersEnabled(Application application) {
        if (application.getJob().getReferenceLettersRequired() <= 0) {
            throw new OperationNotAllowedException("Reference letters are not enabled for this job.");
        }
    }

    /**
     * Builds the invitation email and hands it to the async sender. The referee has no User
     * account, so a transient {@link User} stub holds the email address required by the mail layer.
     *
     * @param application the application the referee is attached to
     * @param entry       the reference request entry containing the referee's name and email
     * @param rawToken    the plaintext token to include in the email
     */
    private void sendInvitation(Application application, ReferenceRequest entry, String rawToken) {
        Job job = application.getJob();
        User refereeStub = new User();
        refereeStub.setEmail(entry.getEmail());
        refereeStub.setFirstName(entry.getFirstName());
        refereeStub.setLastName(entry.getLastName());

        String referenceLink = clientUrl + "/reference/" + rawToken;
        String deadline =
            entry.getTokenExpiresAt() != null ? entry.getTokenExpiresAt().atZone(ZoneOffset.UTC).format(DEADLINE_FORMATTER) : "";

        ReferenceLetterInvitationContextDTO ctx = new ReferenceLetterInvitationContextDTO(
            entry.getTitle(),
            entry.getFirstName(),
            entry.getLastName(),
            application.getApplicantFirstName(),
            application.getApplicantLastName(),
            job.getTitle(),
            job.getResearchGroup().getName(),
            referenceLink,
            deadline
        );

        Email email = Email.builder()
            .to(refereeStub)
            .language(Language.ENGLISH)
            .emailType(EmailType.REFERENCE_LETTER_INVITATION)
            .content(ctx)
            .researchGroup(job.getResearchGroup())
            .sendAlways(true)
            .build();

        emailSender.sendAsync(email);
    }

    /**
     * Resolves the latest valid expiry for a freshly issued token:
     * Job's end date if set, otherwise defaults to {@value #DEFAULT_VALIDITY_MONTHS} months from now.
     *
     * @param job the job the application belongs to, used to determine the token expiry
     * @return the computed token expiry timestamp
     */
    private LocalDateTime computeTokenExpiry(Job job) {
        LocalDate jobEnd = job.getEndDate();

        LocalDate expiryDate = (jobEnd != null) ? jobEnd : LocalDate.now(ZoneOffset.UTC).plusMonths(DEFAULT_VALIDITY_MONTHS);

        return expiryDate.atTime(23, 59, 59);
    }

    /**
     * @return a 256-bit cryptographically random token, URL-safe Base64 encoded.
     */
    private static String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTE_LENGTH];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Hashes a high-entropy token with SHA-256 for safe storage. Plain SHA-256 is acceptable
     * here because the token already carries 256 bits of entropy; slow hashing (BCrypt) would
     * add no additional brute-force resistance for a uniformly random secret of this size.
     *
     * @param rawToken the plaintext token to hash
     * @return the hashed token
     */
    private static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is required", e);
        }
    }
}
