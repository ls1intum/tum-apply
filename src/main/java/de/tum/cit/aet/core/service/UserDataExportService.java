package de.tum.cit.aet.core.service;

import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.core.dto.exportdata.ApplicantDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicationExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ApplicationReviewExportDTO;
import de.tum.cit.aet.core.dto.exportdata.DocumentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.InternalCommentExportDTO;
import de.tum.cit.aet.core.dto.exportdata.RatingExportDTO;
import de.tum.cit.aet.core.dto.exportdata.ResearchGroupRoleExportDTO;
import de.tum.cit.aet.core.dto.exportdata.StaffDataDTO;
import de.tum.cit.aet.core.dto.exportdata.UserDataExportDTO;
import de.tum.cit.aet.core.dto.exportdata.UserProfileExportDTO;
import de.tum.cit.aet.core.dto.exportdata.UserSettingDTO;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.job.domain.Job;
import de.tum.cit.aet.notification.dto.EmailSettingDTO;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.usermanagement.domain.Applicant;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDataExportService {

    private final UserRepository userRepository;
    private final ApplicantRepository applicantRepository;
    private final UserSettingRepository userSettingRepository;
    private final EmailSettingRepository emailSettingRepository;
    private final ApplicationRepository applicationRepository;
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final InternalCommentRepository internalCommentRepository;
    private final RatingRepository ratingRepository;

    @Transactional(readOnly = true)
    public UserDataExportDTO exportUserData(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();

        UserProfileExportDTO profile = getUserProfile(user);

        List<UserSettingDTO> settings = getUserSettings(userId);

        List<EmailSettingDTO> emailSettings = getEmailSettings(user);

        ApplicantDataExportDTO applicantData = applicantRepository.existsById(userId) ? getApplicantData(userId) : null;

        StaffDataDTO staffData = getStaffData(user);

        return new UserDataExportDTO(profile, settings, emailSettings, applicantData, staffData);
    }

    // Private helper methods

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
            .findAllByUserId(userId)
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
            .map(app -> new ApplicationExportDTO(app.getJob().getTitle(), app.getState(), app.getDesiredStartDate()))
            .toList();

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
            applications
        );
    }

    private StaffDataDTO getStaffData(User user) {
        List<String> supervisedJobs = user.getPostedJobs().stream().map(Job::getTitle).toList();

        List<ResearchGroupRoleExportDTO> researchGroupRoles = userResearchGroupRoleRepository
            .findAllByUser(user)
            .stream()
            .map(role -> new ResearchGroupRoleExportDTO(role.getResearchGroup().getName(), role.getRole()))
            .toList();

        List<ApplicationReviewExportDTO> reviews = applicationReviewRepository
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

        List<InternalCommentExportDTO> comments = internalCommentRepository
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

        List<RatingExportDTO> ratings = ratingRepository
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

        if (supervisedJobs.isEmpty() && researchGroupRoles.isEmpty() && reviews.isEmpty() && comments.isEmpty() && ratings.isEmpty()) {
            return null;
        }

        return new StaffDataDTO(supervisedJobs, researchGroupRoles, reviews, comments, ratings);
    }
}
