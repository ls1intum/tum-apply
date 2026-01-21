package de.tum.cit.aet.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.constants.DataExportState;
import de.tum.cit.aet.core.constants.Language;
import de.tum.cit.aet.core.domain.DataExportRequest;
import de.tum.cit.aet.core.domain.Document;
import de.tum.cit.aet.core.domain.Image;
import de.tum.cit.aet.core.dto.DataExportStatusDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicantDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicationExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicationReviewExportDTO;
import de.tum.cit.aet.core.dto.exportdata.DocumentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InternalCommentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InterviewProcessExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InterviewSlotExportDTO;
import de.tum.cit.aet.core.dto.exportdata.IntervieweeExportDTO;
import de.tum.cit.aet.core.dto.exportdata.RatingExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ResearchGroupRoleExportDTO;
import de.tum.cit.aet.core.dto.exportdata.StaffDataDTO;
import de.tum.cit.aet.core.dto.exportdata.UserDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.UserProfileExportDTO;
import de.tum.cit.aet.core.dto.exportdata.UserSettingDTO;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.exception.TimeConflictException;
import de.tum.cit.aet.core.exception.TooManyRequestsException;
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.repository.DataExportRequestRepository;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.core.util.FileUtil;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.domain.InterviewProcess;
import de.tum.cit.aet.interview.domain.InterviewSlot;
import de.tum.cit.aet.interview.domain.Interviewee;
import de.tum.cit.aet.interview.repository.InterviewProcessRepository;
import de.tum.cit.aet.interview.repository.InterviewSlotRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.constants.EmailType;
import de.tum.cit.aet.notification.dto.DataExportEmailContext;
import de.tum.cit.aet.notification.dto.EmailSettingDTO;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.notification.service.AsyncEmailSender;
import de.tum.cit.aet.notification.service.mail.Email;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
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
import java.util.stream.Collectors;
import java.util.zip.Deflater;
import java.util.zip.ZipOutputStream;
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

    private final ApplicantRepository applicantRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final DataExportRequestRepository dataExportRequestRepository;
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final InternalCommentRepository internalCommentRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final InterviewProcessRepository interviewProcessRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final DocumentRepository documentRepository;
    private final ImageRepository imageRepository;
    private final EmailSettingRepository emailSettingRepository;
    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final UserSettingRepository userSettingRepository;
    private final AsyncEmailSender sender;

    private final ZipExportService zipExportService;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

    @Value("${aet.client.url}")
    private String clientUrl;

    @Value("${aet.data-export.root:${aet.storage.root:/data/docs}/exports}")
    private String dataExportRoot;

    @Value("${aet.storage.image-root:/storage/images}")
    private String imageRoot;

    @Value("${aet.data-export.expires-days:7}")
    private long exportExpiresDays;

    public DataExportStatusDTO getDataExportStatus(@NonNull UUID userId) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        DataExportRequest latest = dataExportRequestRepository.findTop1ByUserUserIdOrderByCreatedAtDesc(userId).orElse(null);
        LocalDateTime lastRequestedAt = dataExportRequestRepository.findLastRequestedAtForUser(userId).orElse(null);

        if (lastRequestedAt == null && latest != null) {
            lastRequestedAt = latest.getCreatedAt();
        }

        LocalDateTime nextAllowedAt = lastRequestedAt != null ? lastRequestedAt.plusDays(7) : null;
        long cooldownSeconds = 0;
        if (nextAllowedAt != null && nextAllowedAt.isAfter(now)) {
            cooldownSeconds = Duration.between(now, nextAllowedAt).getSeconds();
        }

        DataExportState status = latest != null ? latest.getStatus() : null;
        return new DataExportStatusDTO(status, lastRequestedAt, nextAllowedAt, cooldownSeconds);
    }

    public void initiateDataExportForUser(@NonNull UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        LocalDateTime lastRequestedAt = dataExportRequestRepository.findLastRequestedAtForUser(userId).orElse(null);
        if (lastRequestedAt != null && lastRequestedAt.plusDays(7).isAfter(now)) {
            throw new TooManyRequestsException("Data export can only be requested once per week");
        }

        Set<DataExportState> activeStates = Set.of(DataExportState.REQUESTED, DataExportState.IN_CREATION, DataExportState.EMAIL_SENT);
        if (dataExportRequestRepository.existsByUserUserIdAndStatusIn(userId, activeStates)) {
            throw new TimeConflictException("A data export request is already in progress");
        }

        DataExportRequest request = new DataExportRequest();
        request.setUser(user);
        request.setStatus(DataExportState.REQUESTED);
        request.setLastRequestedAt(now);
        dataExportRequestRepository.save(request);
    }

    public Path getExportPathForToken(@NonNull UUID userId, @NonNull String token) {
        DataExportRequest request = dataExportRequestRepository
            .findByDownloadToken(token)
            .orElseThrow(() -> EntityNotFoundException.forId("DataExportRequest", token));

        if (request.getUser() == null || !request.getUser().getUserId().equals(userId)) {
            throw EntityNotFoundException.forId("DataExportRequest", token);
        }

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        if (request.getExpiresAt() != null && request.getExpiresAt().isBefore(now)) {
            throw new TimeConflictException("Data export link has expired");
        }

        if (!request.getStatus().isDownloadable()) {
            throw new TimeConflictException("Data export is not ready for download");
        }

        if (request.getFilePath() == null || request.getFilePath().isBlank()) {
            throw new UserDataExportException("Data export file is missing");
        }

        Path path = Paths.get(request.getFilePath()).toAbsolutePath().normalize();
        if (!Files.exists(path)) {
            throw new UserDataExportException("Data export file not found");
        }

        if (request.getStatus() == DataExportState.EMAIL_SENT) {
            request.setStatus(DataExportState.DOWNLOADED);
            dataExportRequestRepository.save(request);
        }

        return path;
    }

    @Scheduled(cron = "${aet.data-export.cron:0 0 2 * * *}")
    public void processPendingDataExports() {
        List<DataExportRequest> pending = dataExportRequestRepository.findAllByStatusOrderByCreatedAtAsc(DataExportState.REQUESTED);
        for (DataExportRequest request : pending) {
            try {
                processSingleRequest(request);
            } catch (Exception e) {
                log.error("Data export failed for request {}", request.getExportRequestId(), e);
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

        Path root = Paths.get(dataExportRoot).toAbsolutePath().normalize();
        Files.createDirectories(root);

        String fileName = "data-export-" + request.getUser().getUserId() + "-" + request.getExportRequestId() + ".zip";
        Path zipPath = root.resolve(fileName);

        try (ZipOutputStream zipOut = new ZipOutputStream(new BufferedOutputStream(Files.newOutputStream(zipPath)))) {
            zipOut.setLevel(Deflater.BEST_COMPRESSION);

            String jsonSummary = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(userData);
            zipExportService.addFileToZip(zipOut, "data_export_summary.json", jsonSummary.getBytes());

            List<Document> uploadedDocuments = documentRepository.findByUploadedByUserId(request.getUser().getUserId());
            for (Document document : uploadedDocuments) {
                String entryName = "documents/uploaded/" + document.getDocumentId();
                addDocumentToZip(zipOut, document.getDocumentId(), entryName);
            }

            List<Image> images = imageRepository.findByUploaderId(request.getUser().getUserId());
            for (Image image : images) {
                addImageToZip(zipOut, image);
            }

            zipOut.finish();
        }

        return zipPath;
    }

    private void sendExportReadyEmail(DataExportRequest request) {
        User user = request.getUser();
        String downloadLink = clientUrl + "/api/users/data-export/download/" + request.getDownloadToken();

        Email email = Email.builder()
            .to(user)
            .language(Language.fromCode(user.getSelectedLanguage()))
            .emailType(EmailType.DATA_EXPORT_READY)
            .content(new DataExportEmailContext(user, downloadLink, exportExpiresDays))
            .build();

        sender.sendAsync(email);
    }

    // ------------------------------------ Private helper methods ------------------------------------

    /**
     * Collects all exportable data for the given user, including profile, settings, email settings,
     * and role-specific data (applicant or staff) when applicable.
     *
     * @param userId the ID of the user whose data should be collected
     * @return a {@link UserDataExportDTO} containing all available export data for the user
     * @throws IllegalArgumentException if the user cannot be found
     */
    private UserDataExportDTO collectUserData(@NonNull UUID userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean hasApplicantRole = hasRole(user, UserRole.APPLICANT);
        boolean hasStaffRole = hasRole(user, UserRole.PROFESSOR) || hasRole(user, UserRole.EMPLOYEE) || hasRole(user, UserRole.ADMIN);

        UserProfileExportDTO profile = getUserProfile(user);
        List<UserSettingDTO> settings = getUserSettings(userId);
        List<EmailSettingDTO> emailSettings = getEmailSettings(user);
        ApplicantDataExportDTO applicantData = hasApplicantRole && applicantRepository.existsById(userId) ? getApplicantData(userId) : null;
        StaffDataDTO staffData = hasStaffRole ? getStaffData(user) : null;

        return new UserDataExportDTO(profile, settings, emailSettings, applicantData, staffData);
    }

    private boolean hasRole(User user, UserRole role) {
        if (user.getResearchGroupRoles() == null || user.getResearchGroupRoles().isEmpty()) {
            return false;
        }
        return user.getResearchGroupRoles().stream().map(UserResearchGroupRole::getRole).anyMatch(role::equals);
    }

    private UserProfileExportDTO getUserProfile(User user) {
        return new UserProfileExportDTO(
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getGender(),
            user.getNationality(),
            user.getBirthday()
        );
    }

    private List<UserSettingDTO> getUserSettings(@NonNull UUID userId) {
        return userSettingRepository
            .findAllByIdUserId(userId)
            .stream()
            .map(setting -> new UserSettingDTO(setting.getId().getSettingKey(), setting.getValue()))
            .toList();
    }

    private List<EmailSettingDTO> getEmailSettings(User user) {
        return emailSettingRepository
            .findAllByUser(user)
            .stream()
            .map(setting -> new EmailSettingDTO(setting.getEmailType(), setting.isEnabled()))
            .toList();
    }

    private ApplicantDataExportDTO getApplicantData(@NonNull UUID userId) {
        Applicant applicant = applicantRepository.findById(userId).orElseThrow();

        Set<DocumentExportDTO> documents = documentDictionaryRepository
            .findAllByApplicant(applicant)
            .stream()
            .map(dd ->
                new DocumentExportDTO(
                    dd.getDocument().getDocumentId(),
                    dd.getName(),
                    dd.getDocumentType(),
                    dd.getDocument().getMimeType(),
                    dd.getDocument().getSizeBytes()
                )
            )
            .collect(Collectors.toSet());

        List<ApplicationExportDTO> applications = applicationRepository
            .findAllByApplicantId(userId)
            .stream()
            .map(app ->
                new ApplicationExportDTO(
                    app.getJob().getTitle(),
                    app.getState(),
                    app.getDesiredStartDate(),
                    app.getMotivation(),
                    app.getSpecialSkills(),
                    app.getProjects()
                )
            )
            .toList();

        List<IntervieweeExportDTO> interviewees = getInterviewees(userId);

        return new ApplicantDataExportDTO(
            applicant.getStreet(),
            applicant.getPostalCode(),
            applicant.getCity(),
            applicant.getCountry(),
            applicant.getBachelorDegreeName(),
            applicant.getBachelorGradeUpperLimit(),
            applicant.getBachelorGradeLowerLimit(),
            applicant.getBachelorGrade(),
            applicant.getBachelorUniversity(),
            applicant.getMasterDegreeName(),
            applicant.getMasterGradeUpperLimit(),
            applicant.getMasterGradeLowerLimit(),
            applicant.getMasterGrade(),
            applicant.getMasterUniversity(),
            documents,
            applications,
            interviewees
        );
    }

    private StaffDataDTO getStaffData(User user) {
        List<String> supervisedJobs = user.getPostedJobs().stream().map(Job::getTitle).toList();

        List<ResearchGroupRoleExportDTO> researchGroupRoles = getResearchGroupRoles(user);
        List<ApplicationReviewExportDTO> reviews = getReviews(user);
        List<InternalCommentExportDTO> comments = getComments(user);
        List<RatingExportDTO> ratings = getRatings(user);
        List<InterviewProcess> interviewProcessEntities = getInterviewProcesses(user);
        List<InterviewProcessExportDTO> interviewProcesses = mapInterviewProcesses(interviewProcessEntities);
        List<InterviewSlotExportDTO> interviewSlots = getInterviewSlots(interviewProcessEntities);

        if (
            supervisedJobs.isEmpty() &&
            researchGroupRoles.isEmpty() &&
            reviews.isEmpty() &&
            comments.isEmpty() &&
            ratings.isEmpty() &&
            interviewProcesses.isEmpty() &&
            interviewSlots.isEmpty()
        ) {
            return null;
        }

        return new StaffDataDTO(supervisedJobs, researchGroupRoles, reviews, comments, ratings, interviewProcesses, interviewSlots);
    }

    private List<IntervieweeExportDTO> getInterviewees(@NonNull UUID userId) {
        List<Interviewee> interviewees = intervieweeRepository.findByApplicantUserIdWithDetails(userId);
        if (interviewees == null || interviewees.isEmpty()) {
            return List.of();
        }

        return interviewees
            .stream()
            .map(interviewee ->
                new IntervieweeExportDTO(interviewee.getInterviewProcess().getJob().getTitle(), interviewee.getLastInvited())
            )
            .toList();
    }

    private List<InterviewProcess> getInterviewProcesses(User user) {
        List<InterviewProcess> processes = interviewProcessRepository.findAllByProfessorId(user.getUserId());
        return processes == null ? List.of() : processes;
    }

    private List<InterviewProcessExportDTO> mapInterviewProcesses(List<InterviewProcess> processes) {
        if (processes == null || processes.isEmpty()) {
            return List.of();
        }
        return processes
            .stream()
            .map(process -> new InterviewProcessExportDTO(process.getJob().getTitle()))
            .toList();
    }

    private List<InterviewSlotExportDTO> getInterviewSlots(List<InterviewProcess> interviewProcesses) {
        if (interviewProcesses == null || interviewProcesses.isEmpty()) {
            return List.of();
        }
        List<UUID> processIds = interviewProcesses.stream().map(InterviewProcess::getId).toList();
        List<InterviewSlot> slots = interviewSlotRepository.findByInterviewProcessIdInWithJob(processIds);
        if (slots == null || slots.isEmpty()) {
            return List.of();
        }
        return slots.stream().map(this::mapInterviewSlot).toList();
    }

    private List<ResearchGroupRoleExportDTO> getResearchGroupRoles(User user) {
        return userResearchGroupRoleRepository
            .findAllByUser(user)
            .stream()
            .filter(role -> role.getResearchGroup() != null)
            .map(role ->
                new ResearchGroupRoleExportDTO(
                    role.getResearchGroup().getName() != null ? role.getResearchGroup().getName() : "",
                    role.getRole()
                )
            )
            .toList();
    }

    private List<ApplicationReviewExportDTO> getReviews(User user) {
        return applicationReviewRepository
            .findAllByReviewedBy(user)
            .stream()
            .map(review ->
                new ApplicationReviewExportDTO(
                    review.getApplication().getJob().getTitle(),
                    review.getApplication().getApplicant().getUser().getFirstName() +
                        " " +
                        review.getApplication().getApplicant().getUser().getLastName(),
                    review.getReason(),
                    review.getReviewedAt()
                )
            )
            .toList();
    }

    private List<InternalCommentExportDTO> getComments(User user) {
        return internalCommentRepository
            .findAllByCreatedBy(user)
            .stream()
            .map(comment ->
                new InternalCommentExportDTO(
                    comment.getApplication().getJob().getTitle(),
                    comment.getApplication().getApplicant().getUser().getFirstName() +
                        " " +
                        comment.getApplication().getApplicant().getUser().getLastName(),
                    comment.getMessage(),
                    comment.getCreatedAt()
                )
            )
            .toList();
    }

    private List<RatingExportDTO> getRatings(User user) {
        return ratingRepository
            .findAllByFrom(user)
            .stream()
            .map(rating ->
                new RatingExportDTO(
                    rating.getApplication().getJob().getTitle(),
                    rating.getApplication().getApplicant().getUser().getFirstName() +
                        " " +
                        rating.getApplication().getApplicant().getUser().getLastName(),
                    rating.getRating(),
                    rating.getCreatedAt()
                )
            )
            .toList();
    }

    private InterviewSlotExportDTO mapInterviewSlot(InterviewSlot slot) {
        return new InterviewSlotExportDTO(
            slot.getInterviewProcess().getJob().getTitle(),
            slot.getStartDateTime(),
            slot.getEndDateTime(),
            slot.getLocation(),
            slot.getStreamLink(),
            slot.getIsBooked()
        );
    }

    private void addDocumentToZip(ZipOutputStream zipOut, @NonNull UUID documentId, String entryPath) {
        try {
            Document document = documentRepository
                .findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

            zipExportService.addDocumentToZip(zipOut, entryPath, document);
        } catch (Exception e) {
            log.error("Failed to add document {} to ZIP export", documentId, e);
            throw new UserDataExportException("Failed to add document to ZIP export", e);
        }
    }

    private void addImageToZip(ZipOutputStream zipOut, Image image) {
        try {
            String url = image.getUrl();
            if (url == null || url.isBlank()) {
                return;
            }

            String relativePath = url.startsWith("/images/") ? url.substring("/images/".length()) : url;
            Path relative = Paths.get(relativePath).normalize();
            if (relative.isAbsolute() || relative.startsWith("..")) {
                throw new UserDataExportException("Invalid image path: " + relativePath);
            }

            Path root = Paths.get(imageRoot).toAbsolutePath().normalize();
            Path imagePath = root.resolve(relative).normalize();
            if (!imagePath.startsWith(root)) {
                throw new UserDataExportException("Image path lies outside storage root: " + imagePath);
            }

            if (!Files.exists(imagePath)) {
                throw new UserDataExportException("Image file not found: " + imagePath);
            }

            String fileName = FileUtil.sanitizeFilename(imagePath.getFileName().toString());
            String parentPath = relative.getParent() != null ? relative.getParent().toString().replace("\\", "/") + "/" : "";
            String entryPath = "images/" + parentPath + fileName;

            try (InputStream inputStream = Files.newInputStream(imagePath)) {
                zipExportService.addFileToZip(zipOut, entryPath, inputStream);
            }
        } catch (Exception e) {
            log.error("Failed to add image {} to ZIP export", image.getImageId(), e);
            throw new UserDataExportException("Failed to add image to ZIP export", e);
        }
    }
}
