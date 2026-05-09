package de.tum.cit.aet.reference.service;

import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.Language;
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
import de.tum.cit.aet.reference.dto.ReferenceRequestDTO;
import de.tum.cit.aet.reference.repository.ReferenceRequestRepository;
import de.tum.cit.aet.usermanagement.domain.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Manages the referee contacts an applicant attaches to an application and dispatches the
 * tokenized invitation emails when the application is submitted.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReferenceRequestService {

    private static final int TOKEN_BYTE_LENGTH = 32;
    private static final int DEFAULT_VALIDITY_MONTHS = 2;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final DateTimeFormatter DEADLINE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final ReferenceRequestRepository referenceRequestRepository;
    private final ApplicationRepository applicationRepository;
    private final CurrentUserService currentUserService;
    private final AsyncEmailSender emailSender;

    @Value("${aet.client.url:}")
    private String clientUrl;

    /**
     * Lists all referee contacts attached to the given application, ordered by creation time.
     *
     * @param applicationId the owning application
     * @return all reference requests, mapped to DTOs (no token data)
     */
    @Transactional(readOnly = true)
    public List<ReferenceRequestDTO> listForApplication(UUID applicationId) {
        Application application = assertOwnsApplication(applicationId);
        return referenceRequestRepository
            .findByApplication_ApplicationIdOrderByCreatedAtAsc(application.getApplicationId())
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
    @Transactional
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
    @Transactional
    public void removeFromApplication(UUID applicationId, UUID referenceId) {
        Application application = assertOwnsApplication(applicationId);
        assertApplicationEditable(application);

        ReferenceRequest entry = referenceRequestRepository
            .findById(referenceId)
            .orElseThrow(() -> EntityNotFoundException.forId("ReferenceRequest", referenceId));
        if (!entry.getApplication().getApplicationId().equals(application.getApplicationId())) {
            throw new OperationNotAllowedException("Reference does not belong to the given application.");
        }
        referenceRequestRepository.delete(entry);
    }

    /**
     * Generates and persists a fresh token for each pending entry on the application and dispatches
     * the invitation email.
     *
     * @param application the application whose referees should be notified
     */
    @Transactional
    public void dispatchInvitations(Application application) {
        if (application.getJob().getReferenceLettersRequired() <= 0) {
            return;
        }
        List<ReferenceRequest> entries = referenceRequestRepository.findByApplication_ApplicationIdOrderByCreatedAtAsc(
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
     * Loads the application and verifies the current user owns it (or is an admin).
     *
     * @param applicationId the application to load
     * @return the loaded application
     */
    private Application assertOwnsApplication(UUID applicationId) {
        Application application = applicationRepository
            .findById(applicationId)
            .orElseThrow(() -> EntityNotFoundException.forId("Application", applicationId));
        currentUserService.isCurrentUserOrAdmin(application.getApplicant().getUserId());
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
     */
    private void sendInvitation(Application application, ReferenceRequest entry, String rawToken) {
        Job job = application.getJob();
        User refereeStub = new User();
        refereeStub.setEmail(entry.getEmail());
        refereeStub.setFirstName(entry.getFirstName());
        refereeStub.setLastName(entry.getLastName());

        String referenceLink = clientUrl + "/reference/" + rawToken;
        String deadline = entry.getTokenExpiresAt() != null ? entry.getTokenExpiresAt().toLocalDate().format(DEADLINE_FORMATTER) : "";

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
     */
    private LocalDateTime computeTokenExpiry(Job job) {
        LocalDate jobEnd = job.getEndDate();
        if (jobEnd != null) {
            return jobEnd.atTime(23, 59, 59);
        }
        return LocalDateTime.now().plusMonths(DEFAULT_VALIDITY_MONTHS);
    }

    /**
     * Generates a 256-bit cryptographically random token, URL-safe Base64 encoded.
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
