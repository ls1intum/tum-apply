package de.tum.cit.aet.core.service;

import com.itextpdf.io.exceptions.IOException;
import de.tum.cit.aet.application.constants.ApplicationState;
import de.tum.cit.aet.application.domain.Application;
import de.tum.cit.aet.application.repository.ApplicationRepository;
import de.tum.cit.aet.application.repository.CustomFieldAnswerRepository;
import de.tum.cit.aet.core.exception.AccessDeniedException;
import de.tum.cit.aet.core.exception.EntityNotFoundException;
import de.tum.cit.aet.core.repository.DocumentDictionaryRepository;
import de.tum.cit.aet.core.repository.DocumentRepository;
import de.tum.cit.aet.core.repository.ImageRepository;
import de.tum.cit.aet.evaluation.repository.ApplicationReviewRepository;
import de.tum.cit.aet.evaluation.repository.InternalCommentRepository;
import de.tum.cit.aet.evaluation.repository.RatingRepository;
import de.tum.cit.aet.interview.repository.IntervieweeRepository;
import de.tum.cit.aet.notification.repository.EmailSettingRepository;
import de.tum.cit.aet.notification.repository.EmailTemplateRepository;
import de.tum.cit.aet.usermanagement.constants.UserRole;
import de.tum.cit.aet.usermanagement.domain.User;
import de.tum.cit.aet.usermanagement.domain.UserResearchGroupRole;
import de.tum.cit.aet.usermanagement.repository.ApplicantRepository;
import de.tum.cit.aet.usermanagement.repository.UserRepository;
import de.tum.cit.aet.usermanagement.repository.UserResearchGroupRoleRepository;
import de.tum.cit.aet.usermanagement.repository.UserSettingRepository;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDataDeletionService {

    private final UserRepository userRepository;
    private final ApplicantRepository applicantRepository;
    private final UserResearchGroupRoleRepository userResearchGroupRoleRepository;
    private final UserSettingRepository userSettingRepository;
    private final EmailSettingRepository emailSettingRepository;
    private final EmailTemplateRepository emailTemplateRepository;
    private final ApplicationRepository applicationRepository;
    private final CustomFieldAnswerRepository customFieldAnswerRepository;
    private final DocumentDictionaryRepository documentDictionaryRepository;
    private final ApplicationReviewRepository applicationReviewRepository;
    private final InternalCommentRepository internalCommentRepository;
    private final RatingRepository ratingRepository;
    private final DocumentRepository documentRepository;
    private final ImageRepository imageRepository;
    private final IntervieweeRepository intervieweeRepository;

    /**
     * Deletes all data associated with the specified user from application repositories and any external storage,
     * then removes the user entity itself from the user repository.
     *
     * <p>This is a destructive, irreversible operation. It attempts to remove user-related records (for example,
     * application data, attachments, audit logs or other persisted artifacts) and any external resources owned by the
     * user. Callers should be aware that partial deletions may occur if an error is encountered during cleanup.</p>
     *
     * @param userId the UUID of the user whose data should be deleted; must not be {@code null}
     * @throws IOException if an I/O error occurs while deleting user-related data from repositories or external systems
     */
    public void deleteUserData(UUID userId) throws IOException {
        User user = userRepository.findById(userId).orElseThrow(() -> EntityNotFoundException.forId("User", userId));
        List<UserRole> roles = userResearchGroupRoleRepository.findAllByUser(user).stream().map(UserResearchGroupRole::getRole).toList();

        if (roles.contains(UserRole.ADMIN)) {
            throw new AccessDeniedException("Admins cannot delete themselves.");
        }

        deleteCommonUserData(userId, user);

        if (roles.contains(UserRole.PROFESSOR)) {
            deleteProfesserUserData(userId, user);
        }

        if (roles.contains(UserRole.APPLICANT)) {
            deleteApplicantUserData(userId, user);
        }

        if (roles.contains(UserRole.EMPLOYEE)) {
            deleteEmployeeUserData(userId, user);
        }

        // Finally, delete the user
        userRepository.deleteById(userId);
    }

    // ---------------------------- Helper methods ------------------------------

    private void deleteCommonUserData(UUID userId, User user) {
        emailSettingRepository.deleteByUserId(userId);
        userResearchGroupRoleRepository.deleteByUserId(userId);
        userSettingRepository.deleteByUserId(userId);
        // TODO: delete missing files
    }

    private void deleteProfesserUserData(UUID userId, User professor) {
        emailTemplateRepository.removeUserInformationFromTemplate(userId);
        imageRepository.deleteProfileImageByUserId(userId);
        imageRepository.anonymizeImagesByUserId(userId);
        // TODO: applications are automatically closed for deleted jobs
    }

    private void deleteEmployeeUserData(UUID userId, User employee) {
        emailTemplateRepository.removeUserInformationFromTemplate(userId);
        imageRepository.deleteProfileImageByUserId(userId);
        imageRepository.anonymizeImagesByUserId(userId);
        // TODO: delete missing files
    }

    private void deleteApplicantUserData(UUID userId, User applicant) {
        imageRepository.deleteProfileImageByUserId(userId);

        List<Application> applications = applicationRepository.findAllByApplicantId(userId);

        EnumSet<ApplicationState> finalStates = EnumSet.of(ApplicationState.REJECTED, ApplicationState.ACCEPTED);

        Map<Boolean, List<Application>> parts = applications
            .stream()
            .collect(Collectors.partitioningBy(appl -> finalStates.contains(appl.getState())));

        List<Application> finalizedApplications = parts.getOrDefault(true, Collections.emptyList());
        List<Application> nonFinalized = parts.getOrDefault(false, Collections.emptyList());

        finalizedApplications.forEach(this::anonymizeApplicationData);
        nonFinalized.forEach(this::deleteApplicationData);

        // documentRepository.deleteByApplicantId(userId);
    }

    private void deleteApplicationData(Application application) {
        UUID applicationId = application.getApplicationId();

        customFieldAnswerRepository.deleteByApplicationId(applicationId);
        documentDictionaryRepository.deleteByApplicationId(applicationId);
        documentRepository.deleteByUploadedBy(applicationId);
        applicationReviewRepository.deleteByApplicationId(applicationId);
        internalCommentRepository.deleteByApplicationId(applicationId);
        ratingRepository.deleteByApplicationId(applicationId);
        intervieweeRepository.deleteByApplicationId(applicationId);

        applicationRepository.deleteById(applicationId);
    }

    private void anonymizeApplicationData(Application application) {
        // TODO: Implement
    }
}
