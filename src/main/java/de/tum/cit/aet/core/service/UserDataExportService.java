package de.tum.cit.aet.core.service;

import de.tum.cit.aet.core.constants.DataExportState;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.DataExportRequest;
import de.tum.cit.aet.core.dto.DataExportStatusDTO;
import de.tum.cit.aet.core.dto.exportdata.UserDataExportDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.TimeConflictException;
import de.tum.cit.aet.core.exception.TooManyRequestsException;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.repository.DataExportRequestRepository;
import de.tum.cit.aet.core.service.export.ExportContext;
import de.tum.cit.aet.core.service.export.UserDataExportBuilder;
import de.tum.cit.aet.core.service.export.UserDataSectionProvider;
import de.tum.cit.aet.core.service.export.UserExportZipWriter;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.dto.DataExportEmailContext;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDataExportService {

    private final DataExportRequestRepository dataExportRequestRepository;
    private final UserRepository userRepository;
    private final AsyncEmailSender sender;

    private final PlatformTransactionManager transactionManager;
    private final List<UserDataSectionProvider> userDataSectionProviders;
    private final UserExportZipWriter userExportZipWriter;

    @Value("${aet.client.url}")
    private String clientUrl;

    @Value("${aet.data-export.expires-days:7}")
    private long exportExpiresDays;

    /**
     * Retrieves the current data export status for the given user, including the most recent request,
     * the last time an export was requested, the next allowed request time based on cooldown rules,
     * and the remaining cooldown in seconds.
     *
     * @param userId the user's unique identifier
     * @return a {@link DataExportStatusDTO} containing status, last requested time, next allowed time,
     *         and cooldown duration in seconds
     */
    public DataExportStatusDTO getDataExportStatus(@NonNull UUID userId) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        DataExportRequest latest = dataExportRequestRepository.findTop1ByUserUserIdOrderByCreatedAtDesc(userId).orElse(null);
        LocalDateTime lastRequestedAt = calculateLastRequestedAt(userId, latest);
        LocalDateTime nextAllowedAt = lastRequestedAt != null ? lastRequestedAt.plusDays(7) : null;
        long cooldownSeconds = calculateCooldownSeconds(now, nextAllowedAt);
        DataExportState status = latest != null ? latest.getStatus() : null;
        String downloadToken = calculateDownloadToken(status, latest);
        return new DataExportStatusDTO(status, lastRequestedAt, nextAllowedAt, cooldownSeconds, downloadToken);
    }

    /**
     * Initiates a data export request for the specified user.
     * This method enforces a weekly cooldown period between export requests and ensures
     * that no active export request is already in progress for the user.
     *
     * @param userId the unique identifier of the user requesting the data export
     * @throws TooManyRequestsException if the user has requested an export within the last 7 days
     * @throws TimeConflictException if an active export request is already in progress
     * @throws IllegalArgumentException if the user does not exist
     */
    public void initiateDataExportForUser(@NonNull UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        LocalDateTime lastRequestedAt = dataExportRequestRepository.findLastRequestedAtForUser(userId).orElse(null);
        if (lastRequestedAt != null && lastRequestedAt.plusDays(7).isAfter(now)) {
            throw new TooManyRequestsException("Data export can only be requested once per week");
        }

        Set<DataExportState> activeCreationStates = Set.of(DataExportState.REQUESTED, DataExportState.IN_CREATION);
        if (dataExportRequestRepository.existsByUserUserIdAndStatusIn(userId, activeCreationStates)) {
            throw new TimeConflictException("A data export request is already in progress");
        }

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.REQUESTED);
        request.setLastRequestedAt(now);
        dataExportRequestRepository.save(request);
    }

    /**
     * Retrieves the file path for a data export based on the provided download token.
     * This method validates the token, ensures the export belongs to the requesting user,
     * checks expiration and downloadability, and updates the export status to DOWNLOADED
     * if it was previously EMAIL_SENT.
     *
     * @param userId the unique identifier of the user requesting the download
     * @param token the download token associated with the export request
     * @return the {@link Path} to the export file
     * @throws EntityNotFoundException if the token is invalid or the export does not belong to the user
     * @throws TimeConflictException if the export link has expired or is not ready for download
     * @throws UserDataExportException if the export file is missing or not found
     */
    public Path getExportPathForToken(@NonNull UUID userId, @NonNull String token) {
        DataExportRequest request = findRequestByToken(token);
        validateRequestBelongsToUser(request, userId, token);
        validateRequestNotExpired(request);
        validateRequestDownloadable(request);
        Path path = validateAndGetFilePath(request);
        updateStatusIfNeeded(request);
        return path;
    }

    /**
     * Retrieves the file path for a data export based on the provided download token.
     * This method is for public downloads and validates the token without requiring user authentication.
     * It checks expiration and downloadability, and updates the export status to DOWNLOADED
     * if it was previously EMAIL_SENT.
     *
     * @param token the download token associated with the export request
     * @return the {@link Path} to the export file
     * @throws EntityNotFoundException if the token is invalid
     * @throws TimeConflictException if the export link has expired or is not ready for download
     * @throws UserDataExportException if the export file is missing or not found
     */
    public Path getExportPathForToken(@NonNull String token) {
        DataExportRequest request = findRequestByToken(token);
        validateRequestNotExpired(request);
        validateRequestDownloadable(request);
        Path path = validateAndGetFilePath(request);
        updateStatusIfNeeded(request);
        return path;
    }

    private DataExportRequest findRequestByToken(String token) {
        return dataExportRequestRepository
            .findByDownloadToken(token)
            .orElseThrow(() -> EntityNotFoundException.forId("DataExportRequest", token));
    }

    private void validateRequestBelongsToUser(DataExportRequest request, UUID userId, String token) {
        if (request.getUser() == null || !request.getUser().getUserId().equals(userId)) {
            throw EntityNotFoundException.forId("DataExportRequest", token);
        }
    }

    private void validateRequestNotExpired(DataExportRequest request) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (request.getExpiresAt() != null && request.getExpiresAt().isBefore(now)) {
            throw new TimeConflictException("Data export link has expired");
        }
    }

    private void validateRequestDownloadable(DataExportRequest request) {
        if (!request.getStatus().isDownloadable()) {
            throw new TimeConflictException("Data export is not ready for download");
        }
    }

    private Path validateAndGetFilePath(DataExportRequest request) {
        if (request.getFilePath() == null || request.getFilePath().isBlank()) {
            throw new UserDataExportException("Data export file is missing");
        }

        Path path = Paths.get(request.getFilePath()).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new UserDataExportException("Data export file not found");
        }

        return path;
    }

    private void updateStatusIfNeeded(DataExportRequest request) {
        if (request.getStatus() == DataExportState.EMAIL_SENT) {
            request.setStatus(DataExportState.DOWNLOADED);
            dataExportRequestRepository.save(request);
        }
    }

    /**
     * Scheduled method that processes all pending data export requests.
     * This method runs nightly (configurable via {@code aet.data-export.cron}) and creates
     * ZIP archives for all REQUESTED exports, sends notification emails, and updates the
     * export status accordingly. Failed exports are marked as FAILED.
     */
    @Scheduled(cron = "${aet.data-export.cron:0 0 2 * * *}")
    public void processPendingDataExports() {
        List<DataExportRequest> pending = dataExportRequestRepository.findAllByStatusOrderByCreatedAtAsc(DataExportState.REQUESTED);

        for (DataExportRequest request : pending) {
            try {
                processSingleRequest(request);
            } catch (Exception e) {
                log.error("Failed to process data export {}", request.getExportRequestId(), e);
                request.setStatus(DataExportState.FAILED);
                dataExportRequestRepository.save(request);
            }
        }
    }

    private void processSingleRequest(DataExportRequest request) throws IOException {
        request.setStatus(DataExportState.IN_CREATION);
        dataExportRequestRepository.save(request);

        Path exportPath = createExportZip(request);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        request.setFilePath(exportPath.toString());
        request.setReadyAt(now);
        request.setExpiresAt(now.plusDays(exportExpiresDays));
        request.setDownloadToken(UUID.randomUUID().toString());
        request.setStatus(DataExportState.EMAIL_SENT);
        dataExportRequestRepository.save(request);

        sendExportReadyEmail(request);
    }

    private Path createExportZip(DataExportRequest request) throws IOException {
        TransactionTemplate tx = new TransactionTemplate(Objects.requireNonNull(transactionManager));
        tx.setReadOnly(true);
        UserDataExportDTO userData = tx.execute(status -> collectUserData(request.getUser().getUserId()));
        if (userData == null) {
            throw new UserDataExportException("User data export failed: could not collect user data");
        }

        return userExportZipWriter.writeExport(request.getUser().getUserId(), request.getExportRequestId(), userData);
    }

    private void sendExportReadyEmail(DataExportRequest request) {
        User user = request.getUser();
        String downloadLink = clientUrl + "/data-export/download/" + request.getDownloadToken();

        Email email = Email.builder()
            .to(user)
            .language(Language.fromCode(user.getSelectedLanguage()))
            .emailType(EmailType.DATA_EXPORT_READY)
            .content(new DataExportEmailContext(user, downloadLink, exportExpiresDays))
            .build();

        sender.sendAsync(email);
    }

    // ------------------------------------ helper methods for collecting user data ------------------------------------

    private UserDataExportDTO collectUserData(@NonNull UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean hasApplicantRole = hasRole(user, UserRole.APPLICANT);
        boolean hasStaffRole = hasRole(user, UserRole.PROFESSOR) || hasRole(user, UserRole.EMPLOYEE) || hasRole(user, UserRole.ADMIN);

        ExportContext context = new ExportContext(user, hasApplicantRole, hasStaffRole);
        UserDataExportBuilder builder = new UserDataExportBuilder();

        for (UserDataSectionProvider provider : userDataSectionProviders) {
            provider.contribute(context, builder);
        }

        return builder.build();
    }

    private boolean hasRole(User user, UserRole role) {
        if (user.getResearchGroupRoles() == null || user.getResearchGroupRoles().isEmpty()) {
            return false;
        }
        return user.getResearchGroupRoles().stream().map(UserResearchGroupRole::getRole).anyMatch(role::equals);
    }

    private LocalDateTime calculateLastRequestedAt(UUID userId, DataExportRequest latest) {
        LocalDateTime lastRequestedAt = dataExportRequestRepository.findLastRequestedAtForUser(userId).orElse(null);
        if (lastRequestedAt == null && latest != null) {
            lastRequestedAt = latest.getCreatedAt();
        }
        return lastRequestedAt;
    }

    private long calculateCooldownSeconds(LocalDateTime now, LocalDateTime nextAllowedAt) {
        if (nextAllowedAt != null && nextAllowedAt.isAfter(now)) {
            return Duration.between(now, nextAllowedAt).getSeconds();
        }
        return 0;
    }

    private String calculateDownloadToken(DataExportState status, DataExportRequest latest) {
        return (status == DataExportState.EMAIL_SENT && latest != null) ? latest.getDownloadToken() : null;
    }
}
