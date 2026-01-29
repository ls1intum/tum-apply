package de.tum.cit.aet.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.cit.aet.application.repository.ApplicationRepository;
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
import de.tum.cit.aet.core.exception.UserDataExportException;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
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
import de.tum.cit.aet.interview.service.InterviewService;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.dto.EmailSettingDTO;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
import jakarta.servlet.http.HttpServletResponse;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.zip.Deflater;
import java.util.zip.ZipOutputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final InternalCommentRepository internalCommentRepository;
    private final IntervieweeRepository intervieweeRepository;
    private final InterviewProcessRepository interviewProcessRepository;
    private final InterviewSlotRepository interviewSlotRepository;
    private final DocumentRepository documentRepository;
    private final EmailSettingRepository emailSettingRepository;
    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final UserSettingRepository userSettingRepository;

    private final InterviewService interviewService;
    private final ZipExportService zipExportService;
    private final DocumentZipUtility documentZipUtility;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

    /**
     * Export all user-related data as a ZIP archive written to the provided {@code HttpServletResponse}.
     *
     * <p>To avoid holding a database transaction open while streaming data to the client,
     * all data required for the JSON summary is collected inside a short read-only transaction
     * first. ZIP/HTTP streaming is then performed outside of that transaction.</p>
     *
     * <p>The generated ZIP contains a JSON summary file ("user_data_summary.json") with the user's profile,
     * settings, email settings, optional applicant data and staff data. If applicant data exists, applicant
     * documents are added to the archive under the {@code documents/} directory; filenames are sanitized with
     * {@link FileUtil#sanitizeFilename(String)}.</p>
     *
     * @param userId   UUID of the user whose data should be exported
     * @param response HTTP response to which the ZIP archive will be written; response headers will be modified
     * @throws IOException              if an I/O error occurs while writing the ZIP to the response stream
     * @throws IllegalArgumentException if the user with the given id does not exist
     */
    public void exportUserData(UUID userId, HttpServletResponse response) throws IOException {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.setReadOnly(true);
        UserDataExportDTO userData = tx.execute(status -> collectUserData(userId));
        if (userData == null) {
            throw new UserDataExportException("User data export failed: could not collect user data");
        }

        zipExportService.initZipResponse(response, "user-data-export-" + userId);

        try (ZipOutputStream zipOut = new ZipOutputStream(new BufferedOutputStream(response.getOutputStream()))) {
            zipOut.setLevel(Deflater.BEST_COMPRESSION);

            // 1. Add JSON summary
            String jsonSummary = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(userData);
            zipExportService.addFileToZip(zipOut, "user_data_summary.json", jsonSummary.getBytes());

            // 2. Add Applicant Documents
            if (userData.applicantData() != null) {
                for (DocumentExportDTO doc : userData.applicantData().documents()) {
                    String sanitizedFilename = FileUtil.sanitizeFilename(doc.name());
                    documentZipUtility.addDocumentToZip(zipOut, doc.documentId(), "documents/" + sanitizedFilename);
                }
            }

            zipOut.finish();
        }
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
    private UserDataExportDTO collectUserData(UUID userId) {
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

    private List<UserSettingDTO> getUserSettings(UUID userId) {
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

    private ApplicantDataExportDTO getApplicantData(UUID userId) {
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

    private List<IntervieweeExportDTO> getInterviewees(UUID userId) {
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
        return interviewService.getInterviewProcessesByProfessor(user);
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
}
